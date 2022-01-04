import { Component, OnInit } from '@angular/core';
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
    private flService: FileLocalService) {}

  enabled = "showDirectoryPicker" in window;

  ngOnInit(): void {
  }

  treeControl = this.flService.treeControl;
  dataSource = this.flService.dataSource;

  hasChild = (_: number, node: FsNode) => node.expandable;

  loadFolder() {
    this.flService.init();
  }

  newFile(root = false) {
    const filename = prompt();
    if (!filename) return;
    this.flService.createFile(filename, root ? undefined : this.selectedNode.value);
  }
  newFolder(root = false) {
    const filename = prompt();
    if (!filename) return;
    this.flService.createFolder(filename, root ? undefined : this.selectedNode.value);
  }
  
  async onSelected(node: FsNode) {
    if (node.expandable) {
      this.treeControl.toggle(node);
    } else {
      this.flService.getFileContent(node.value);
    }
  }

  selectedNode: FsNode = null!;

  showContextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, node: FsNode) {
    this.selectedNode = node;
    this.nzContextMenuService.create($event, menu);
  }

  remove() {
    this.flService.remove(this.selectedNode);
  }
}
