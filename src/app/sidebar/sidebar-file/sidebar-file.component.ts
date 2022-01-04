import { Component, OnInit } from '@angular/core';
import { FsNode, FileLocalService } from '../../services/file-local.service';


@Component({
  selector: 'app-sidebar-file',
  templateUrl: './sidebar-file.component.html',
  styleUrls: ['./sidebar-file.component.scss']
})
export class SidebarFileComponent implements OnInit {
  constructor(private flService: FileLocalService) {}

  enabled = "showDirectoryPicker" in window;

  ngOnInit(): void {
  }

  treeControl = this.flService.treeControl;
  dataSource = this.flService.dataSource;

  hasChild = (_: number, node: FsNode) => node.expandable;

  loadFolder() {
    this.flService.init();
  }
  
  async selectNode(node: FsNode) {
    if (node.expandable) {
      this.treeControl.toggle(node);
    } else {
      this.flService.getFileContent(node.value);
    }
  }
}
