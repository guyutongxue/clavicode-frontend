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

import { Component, OnInit } from '@angular/core';
import type { FlatTreeControl } from '@angular/cdk/tree';
import type { DataSource } from '@angular/cdk/collections';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { FsNode, FileLocalService } from '../../services/file-local.service';


@Component({
  selector: 'app-sidebar-file',
  templateUrl: './sidebar-file.component.html',
  styleUrls: ['./sidebar-file.component.scss']
})
export class SidebarFileComponent implements OnInit {
  constructor(
    private nzContextMenuService: NzContextMenuService,
    private flService: FileLocalService) {
      this.treeControl = this.flService.treeControl;
      this.dataSource = this.flService.dataSource;
    }

  enabled = "showDirectoryPicker" in window;

  ngOnInit(): void {
  }

  treeControl: FlatTreeControl<FsNode>;
  dataSource: DataSource<FsNode>;

  get loaded() {
    return !!this.flService.rootHandle;
  }

  hasChild = (_: number, node: FsNode) => node.expandable;

  loadFolder() {
    this.flService.init();
  }

  newFile(root = false) {
    const filename = prompt();
    if (!filename) return;
    if (root) this.selectedNode = null;
    if (this.selectedNode?.value instanceof FileSystemFileHandle) return;
    this.flService.createFile(filename, this.selectedNode?.value);
  }
  newFolder(root = false) {
    const filename = prompt();
    if (!filename) return;
    if (root) this.selectedNode = null;
    if (this.selectedNode?.value instanceof FileSystemFileHandle) return;
    this.flService.createFolder(filename, this.selectedNode?.value);
  }
  
  async onSelected(node: FsNode) {
    if (node.expandable) {
      this.treeControl.toggle(node);
    } else {
      this.flService.openLocal(node.value);
    }
  }

  selectedNode: FsNode | null = null;

  showContextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, node?: FsNode) {
    this.selectedNode = node ?? null;
    this.nzContextMenuService.create($event, menu);
  }

  remove() {
    if (this.selectedNode !== null) { 
      this.flService.remove(this.selectedNode);
    }
  }
}
