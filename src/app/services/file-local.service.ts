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
import { C_CREATE, C_EXCLUSIVE, C_NONE, E_EXCEPTION, E_FILE_EXIST, E_INTERNAL, E_NO_ENTRY, E_NO_LOCALFS, E_OFFSET, E_PERM_DENIED } from '../pyodide/constants';

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

  constructor(private tabsService: TabsService) {
    let refresh = async () => {
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (this.dirty) {
          await this.refresh();
        }
      }
    };
    refresh();
  }

  private flattenedData = new BehaviorSubject<FsNode[]>([]);
  treeControl = new FlatTreeControl<FsNode>(
    node => node.level,
    node => node.expandable);
  dataSource = new FsDataSource(
    this.treeControl,
    this.flattenedData,
    (node) => { this.loadChildren(node); },
    (node) => { node.expanded = false; })

  rootHandle: FileSystemDirectoryHandle | null = null;

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

  private dirty = false;

  /**
   * 
   * @param handle handle of the node to be refreshed
   * @returns 
   */
  async refresh(handle?: FileSystemDirectoryHandle) {
    if (typeof handle === "undefined") {
      if (this.rootHandle === null) return;
      handle = this.rootHandle;
    }
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
    this.dirty = false;
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
      await handle.removeEntry(name, {
        recursive: true
      });
      this.refresh(handle);
    }
  }

  private async getHandleByPath(path: string, create = C_CREATE): Promise<[null, number] | [FileSystemFileHandle, ...FileSystemDirectoryHandle[]]> {
    if (this.rootHandle === null) return [null, E_NO_LOCALFS];
    const pathSeg = path.split('/');
    let handle = this.rootHandle;
    const handles = [this.rootHandle];

    async function iter(type: 'getDirectoryHandle', handle: FileSystemDirectoryHandle, name: string): Promise<FileSystemDirectoryHandle | number>;
    async function iter(type: 'getFileHandle', handle: FileSystemDirectoryHandle, name: string): Promise<FileSystemFileHandle | number>;
    async function iter(type: 'getDirectoryHandle' | 'getFileHandle', handle: FileSystemDirectoryHandle, name: string): Promise<FileSystemDirectoryHandle | FileSystemFileHandle | number> {
      switch (create) {
        case C_CREATE:
          return await handle[type](name, { create: true });
        case C_NONE:
          try {
            return await handle[type](name);
          } catch (e) {
            if (e instanceof DOMException && e.name === 'NotFoundError') {
              return E_NO_ENTRY;
            } else {
              throw e;
            }
          }
        case C_EXCLUSIVE:
          try {
            await handle[type](name);
            return E_FILE_EXIST;
          } catch (e) {
            if (e instanceof DOMException && e.name === 'NotFoundError') {
              return await handle[type](name, { create: true });
            } else {
              throw e;
            }
          }
        default:
          return E_INTERNAL;
      }
    };

    try {
      while (pathSeg.length > 1) {
        const name = pathSeg.shift()!;
        const result = await iter('getDirectoryHandle', handle, name);
        if (typeof result === "number") {
          return [null, result];
        }
        handles.push(handle = result);
      }
      const filename = pathSeg[0];
      const result = await iter('getFileHandle', handle, filename);
      if (typeof result === "number") {
        return [null, result];
      }
      return [result, ...handles.reverse()];
    } catch (e) {
      if (e instanceof DOMException && e.name === 'NotAllowedError') {
        return [null, E_PERM_DENIED];
      }
      console.log(e);
      return [null, E_EXCEPTION];
    }
  }

  async save(tab: Tab | null) {
    if (tab === null) return false;
    this.tabsService.syncActiveCode();
    const [fileHandle] = await this.getHandleByPath(tab.path);
    if (fileHandle === null) return false;
    try {
      if (!(await this.requestPermission(fileHandle))) return false;
      const writable = await fileHandle.createWritable();
      await writable.write(tab.code);
      await writable.close();
      tab.saved = true;
      return true;
    } catch {
      return false;
    }
  }

  async readRaw(path: string, offset: number, create: number): Promise<[number, Uint8Array | null]> {
    if (this.rootHandle === null) return [E_NO_LOCALFS, null];
    const res = await this.getHandleByPath(path, create);
    if (res[0] === null) return [res[1], null];
    if (!(await this.requestPermission(res[0]))) return [E_PERM_DENIED, null];
    try {
      const file = await res[0].getFile();
      if (file.size < offset) return [E_OFFSET, null];
      return [file.size - offset, new Uint8Array(await file.arrayBuffer(), offset)];
    } catch (e) {
      console.log(e);
      return [E_EXCEPTION, null];
    }
  }

  async writeRaw(path: string, offset: number, data: Uint8Array) {
    if (this.rootHandle === null) return E_NO_LOCALFS;
    const res = await this.getHandleByPath(path);
    if (res[0] === null) return res[1];
    if (!(await this.requestPermission(res[0]))) return E_PERM_DENIED;
    try {
      const writable = await res[0].createWritable({
        keepExistingData: offset !== 0
      });
      await writable.seek(offset);
      await writable.write(data);
      console.log({ offset, data });
      await writable.close();
      if (typeof parent !== "undefined") {
        // FIXME：密集的刷新导致显示异常
        this.dirty = true;
      }
      return 0;
    } catch (e: any) {
      console.log(e);
      return E_EXCEPTION;
    }
  }
}
