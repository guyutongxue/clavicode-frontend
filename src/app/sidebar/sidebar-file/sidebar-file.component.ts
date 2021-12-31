import { Component, OnInit } from '@angular/core';
import { CollectionViewer, DataSource, SelectionChange } from '@angular/cdk/collections';
import { FlatTreeControl, TreeControl } from '@angular/cdk/tree';
import { BehaviorSubject, merge, Observable, scheduled } from 'rxjs';
import { map, tap } from 'rxjs/operators';

interface FsNode {
  name: string;
  value: any;
  level: number;
  expandable: boolean;
  expanded: boolean;
  loaded: 'no' | 'doing' | 'yes';
}

class FsDataSource implements DataSource<FsNode> {
  constructor(private treeControl: TreeControl<FsNode>,
    private flattenedData: BehaviorSubject<FsNode[]>,
    private onExpand: (node: FsNode) => void,
    private onShrink: (node: FsNode) => void) {
    treeControl.dataNodes = this.flattenedData.value;
  }

  connect(collectionViewer: CollectionViewer): Observable<FsNode[]> {
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

  expandFlattenedNodes(nodes: FsNode[]): FsNode[] {
    const treeControl = this.treeControl;
    const results: FsNode[] = [];
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

  handleExpansionChange(change: SelectionChange<FsNode>): void {
    const changeList = [...change.added, ...change.removed];
    for (const change of changeList) {
      if (change.expanded) this.onShrink(change);
      else this.onExpand(change);
    }
  }

  disconnect(): void { }
}

@Component({
  selector: 'app-sidebar-file',
  templateUrl: './sidebar-file.component.html',
  styleUrls: ['./sidebar-file.component.scss']
})
export class SidebarFileComponent implements OnInit {
  constructor() {}

  enabled = "showDirectoryPicker" in window;

  ngOnInit(): void {
    // this.flattenedData.subscribe(console.log);
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

  private async loadChildren(node: FsNode) {
    if (node.loaded === 'yes') {
      node.expanded = true;
      return;
    }
    node.loaded = 'doing';
    const handle = node.value;
    const children: FsNode[] = [];
    for await (const [key, value] of handle.entries()) {
      children.push({
        name: key,
        value: value,
        level: node.level + 1,
        expandable: value.kind === "directory",
        expanded: false,
        loaded: 'no'
      });
    }
    node.loaded = 'yes';
    const data = this.flattenedData.value;
    const index = data.findIndex(v => v === node);
    data.splice(index + 1, 0, ...children);
    data[index].expanded = true;
    this.flattenedData.next(data);
  }

  hasChild = (_: number, node: FsNode) => node.expandable;

  async loadFolder() {
    const handle = await (window as any).showDirectoryPicker().catch(() => null);
    if (!handle) return;
    const data: FsNode[] = [];
    for await (const [key, value] of handle.entries()) {
      data.push({
        name: key,
        value: value,
        level: 0,
        expandable: value.kind === "directory",
        expanded: false,
        loaded: 'no'
      });
    }
    this.flattenedData.next(data);
  }
  
  async selectNode(node: FsNode) {
    if (node.expandable) {
      this.treeControl.toggle(node);
    } else {
      const handle = node.value;
      const opt = {
        writable: true,
        mode: 'readwrite'
      };
      if ((await handle.queryPermission(opt)) !== 'granted' && await handle.requestPermission(opt) !== 'granted') {

      } else {
        const file = await handle.getFile();
        const code = await file.text();
        alert(code);
      }
    }
  }
}
