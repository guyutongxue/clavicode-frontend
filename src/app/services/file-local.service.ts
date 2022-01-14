// Copyright (C) 2022 Clavicode Team
// 
// This file is part of clavicode-frontend.
// 
// clavicode-frontend is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// clavicode-frontend is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with clavicode-frontend.  If not, see <http://www.gnu.org/licenses/>.

/// <reference types="wicg-file-system-access" />

import { Injectable } from '@angular/core';
import { FlatTreeControl, TreeControl } from '@angular/cdk/tree';
import { CollectionViewer, DataSource, SelectionChange } from '@angular/cdk/collections';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Tab, TabsService } from './tabs.service';

import { v4 as uuid } from 'uuid';
import { basename } from 'path';

export type FsNode = {
  name: string;
  value: FileSystemHandle;
  level: number;
  expandable: boolean;
  expanded: boolean;
  loaded: 'no' | 'doing' | 'yes';
}

class FsDataSource<T extends { expanded: boolean }> implements DataSource<T> {
  constructor(private treeControl: TreeControl<T>,
    private flattenedData: BehaviorSubject<T[]>,
    private onExpand: (node: T) => void,
    private onShrink: (node: T) => void) {
    treeControl.dataNodes = this.flattenedData.value;
  }

  connect(collectionViewer: CollectionViewer): Observable<T[]> {
    const changes: Observable<unknown>[] = [
      collectionViewer.viewChange,
      this.treeControl.expansionModel.changed.pipe(tap(change => this.handleExpansionChange(change))),
      this.flattenedData
    ];
    return merge(...changes).pipe(
      map(() => {
        return this.expandFlattenedNodes(this.flattenedData.value);
      })
    );
  }

  expandFlattenedNodes(nodes: T[]): T[] {
    const treeControl = this.treeControl;
    const results: T[] = [];
    const currentExpand: boolean[] = [];
    currentExpand[0] = true;

    nodes.forEach(node => {
      let expand = true;
      for (let i = 0; i <= treeControl.getLevel(node); i++) {
        expand = expand && currentExpand[i];
      }
      if (expand) {
        results.push(node);
      }
      if (treeControl.isExpandable(node)) {
        currentExpand[treeControl.getLevel(node) + 1] = node.expanded;
      }
    });
    return results;
  }

  handleExpansionChange(change: SelectionChange<T>): void {
    const changeList = [...change.added, ...change.removed];
    for (const change of changeList) {
      if (change.expanded) this.onShrink(change);
      else this.onExpand(change);
    }
  }

  disconnect(): void { }
}


const REQ_RW_OPT: FileSystemHandlePermissionDescriptor = {
  writable: true,
  mode: 'readwrite'
};

@Injectable({
  providedIn: 'root'
})
export class FileLocalService {

  constructor(private tabsService: TabsService) { }

  private flattenedData = new BehaviorSubject<FsNode[]>([]);
  treeControl = new FlatTreeControl<FsNode>(
    node => node.level,
    node => node.expandable);
  dataSource = new FsDataSource(
    this.treeControl,
    this.flattenedData,
    (node) => { this.loadChildren(node); },
    (node) => { node.expanded = false; })

  private rootHandle: FileSystemDirectoryHandle | null = null;

  private async getChildren(handle: FileSystemDirectoryHandle, level: number) {
    const children: FsNode[] = [];
    for await (const [key, value] of handle.entries()) {
      children.push({
        name: key,
        value: value,
        level: level + 1,
        expandable: value.kind === "directory",
        expanded: false,
        loaded: 'no'
      });
    }
    return children;
  }

  private async loadChildren(node: FsNode, index?: number) {
    if (node.loaded === 'yes') {
      node.expanded = true;
      return;
    }
    node.loaded = 'doing';
    const handle = node.value;
    if (handle instanceof FileSystemFileHandle) return;
    const children = await this.getChildren(handle, node.level);
    node.loaded = 'yes';
    const data = this.flattenedData.value;
    if (typeof index === "undefined") {
      index = data.findIndex(v => v === node);
    }
    data.splice(index + 1, 0, ...children);
    data[index].expanded = true;
    this.flattenedData.next(data);
  }

  /**
   * 
   * @param handle handle of the node to be refreshed
   * @returns 
   */
  private async refresh(handle: FileSystemDirectoryHandle) {
    const data = this.flattenedData.value;
    const index = data.findIndex(v => v.value === handle);
    const node = data[index] as FsNode | undefined;
    if (node) {
      if (!node.expandable) return;
      if (node.loaded !== "yes") return;
      node.loaded = "no";
      if (!node.expanded) return;
      node.loaded = "doing";
    }
    // 找到此目录下的所有子文件
    const level = node?.level ?? -1;
    let endIndex = index + 1;
    while (endIndex < data.length && data[endIndex].level > level) {
      endIndex++;
    }
    endIndex--;
    // Try to expand originally expanded children. Hard to impl..
    // const expandedChildren = data.slice(index, endIndex)
    //   .filter(v => v.level === level - 1 && v.expanded)
    //   .map(v => v.name);
    const newChildren = await this.getChildren(handle, node?.level ?? -1);
    // 移除原有子节点，更换为新的子节点
    data.splice(index + 1, endIndex - index, ...newChildren);
    if (node) {
      node.loaded = "yes";
    }
    this.flattenedData.next(data);
  }

  async init() {
    const handle = await window.showDirectoryPicker().catch(() => null);
    if (!handle) return;
    const data = await this.getChildren(handle, -1);
    this.flattenedData.next(data);
    this.rootHandle = handle;
  }

  private async requestPermission(handle: FileSystemHandle) {
    return !((await handle.queryPermission(REQ_RW_OPT)) !== 'granted' &&
      await handle.requestPermission(REQ_RW_OPT) !== 'granted');
  }

  async openLocal(handle: FileSystemHandle) {
    if (handle.kind !== "file") return false;
    if (await this.requestPermission(handle)) {
      const path = (await this.rootHandle?.resolve(handle))?.join('/');
      if (!path) return false;
      const exist = this.tabsService.tabList.find(v => v.path === path);
      if (exist) {
        this.tabsService.changeActive(exist.key);
        return true;
      }
      const file = await handle.getFile();
      // TODO: Avoid opening big files
      const key = uuid();
      // TODO: Use package "chardet" to detect encoding
      const code = await file.text();
      this.tabsService.add({
        key: key,
        type: "local",
        title: basename(path),
        code: code,
        path: path,
      });
      this.tabsService.changeActive(key);
      return true;
    } else {
      return false;
    }
  }

  async createFile(name: string, handle?: FileSystemDirectoryHandle) {
    if (!this.rootHandle) return;
    if (!handle) handle = this.rootHandle;
    if (await this.requestPermission(handle)) {
      const file = await handle.getFileHandle(name, {
        create: true
      });
      this.refresh(handle);
    }
  }

  async createFolder(name: string, handle?: FileSystemDirectoryHandle) {
    if (!this.rootHandle) return;
    if (!handle) handle = this.rootHandle;
    if (await this.requestPermission(handle)) {
      const dir = await handle.getDirectoryHandle(name, {
        create: true
      });
      this.refresh(handle);
    }
  }

  private getParent(node: FsNode): FileSystemDirectoryHandle | null {
    const data = this.flattenedData.value;
    const index = data.findIndex(v => v === node);
    let parent = index - 1;
    while (parent >= 0 && data[parent].level >= node.level) {
      parent--;
    }
    if (parent === -1) return this.rootHandle;
    const handle = data[parent].value;
    if (handle instanceof FileSystemFileHandle) {
      // should unreachable
      return null;
    }
    return handle;
  }

  async remove(node: FsNode) {
    const name = node.name;
    const handle = this.getParent(node);
    if (handle && await this.requestPermission(handle)) {
      await handle.removeEntry(name);
      this.refresh(handle);
    }
  }

  async save(tab: Tab | null) {
    if (tab === null) return false;
    this.tabsService.syncActiveCode();
    if (this.rootHandle === null) return false;
    const pathSeg = tab.path.split('/');
    try {
      let handle = this.rootHandle;
      while (pathSeg.length > 1) {
        const name = pathSeg.shift()!;
        handle = await handle.getDirectoryHandle(name);
      }
      const filename = pathSeg[0];
      const fileHandle = await handle.getFileHandle(filename);
      if (!(await this.requestPermission(fileHandle))) return false;
      const writable = await fileHandle.createWritable();
      await writable.write(tab.code);
      await writable.close();
      tab.saved = true;
      console.log(fileHandle);
      return true;
    } catch {
      return false;
    }
  }
}
