import { Injectable } from '@angular/core';
import { FlatTreeControl, TreeControl } from '@angular/cdk/tree';
import { CollectionViewer, DataSource, SelectionChange } from '@angular/cdk/collections';
import { BehaviorSubject, merge, Observable, scheduled } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TabsService } from './tabs.service';

import { v4 as uuid } from 'uuid';
import { basename } from 'path';

export type FsNode = {
  name: string;
  value: any;
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
    const changes: Observable<any>[] = [
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


const REQ_RW_OPT = {
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

  private rootHandle: any;

  private async getChildren(handle: any, level: number) {
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
  private async refresh(handle: any) {
    const data = this.flattenedData.value;
    const index = data.findIndex(v => v.value === handle);
    const node = data[index];
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
    const newChildren = await this.getChildren(node?.value ?? this.rootHandle, node?.level ?? -1);
    data.splice(index + 1, endIndex - index, ...newChildren);
    if (node) {
      node.loaded = "yes";
    }
    this.flattenedData.next(data);
  }

  async init() {
    const handle = await (window as any).showDirectoryPicker().catch(() => null);
    if (!handle) return;
    const data = await this.getChildren(handle, -1);
    this.flattenedData.next(data);
    this.rootHandle = handle;
  }

  private async requestPermission(handle: any) {
    return !((await handle.queryPermission(REQ_RW_OPT)) !== 'granted' &&
      await handle.requestPermission(REQ_RW_OPT) !== 'granted');
  }

  async openLocal(handle: any) {
    if (handle.kind !== "file") return false;
    if (await this.requestPermission(handle)) {
      const path: string = (await this.rootHandle.resolve(handle)).join('/');
      const exist = this.tabsService.tabList.find(v => v.path === path);
      if (exist) {
        this.tabsService.changeActive(exist.key);
        return true;
      }
      const file = await handle.getFile();
      const key = uuid();
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

  async createFile(name: string, handle?: any) {
    if (!handle) handle = this.rootHandle;
    if (await this.requestPermission(handle)) {
      const file = await handle.getFileHandle(name, {
        create: true
      });
      this.refresh(handle);
    }
  }

  async createFolder(name: string, handle?: any) {
    if (!handle) handle = this.rootHandle;
    if (await this.requestPermission(handle)) {
      const dir = await handle.getDirectoryHandle(name, {
        create: true
      });
      this.refresh(handle);
    }
  }

  private getParent(node: FsNode) {
    const data = this.flattenedData.value;
    const index = data.findIndex(v => v === node);
    let parent = index - 1;
    while (parent >= 0 && data[parent].level >= node.level) {
      parent--;
    }
    if (parent === -1) return this.rootHandle;
    return data[parent].value;
  }

  async remove(node: FsNode) {
    const name = node.name;
    const handle = this.getParent(node);
    if (await this.requestPermission(handle)) {
      await handle.removeEntry(name);
      this.refresh(handle);
    }
  }
}
