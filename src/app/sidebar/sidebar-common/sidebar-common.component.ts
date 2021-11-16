import { Component, OnInit } from '@angular/core';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { ExecuteService } from '../../services/execute.service';
import { Router } from '@angular/router';
import { CompileService } from '../../services/compile.service';
import { EditorService } from '../../services/editor.service';
import { DialogService } from '@ngneat/dialog';
import { MainViewComponent } from '../../main-view/main-view.component';
@Component({
  selector: 'app-sidebar-common',
  templateUrl: './sidebar-common.component.html',
  styleUrls: ['./sidebar-common.component.scss']
})
export class SidebarCommonComponent implements OnInit {

  constructor(private router: Router,
    private dialogService: DialogService,
    private executeService: ExecuteService, 
    private compileService: CompileService,
    private editorService: EditorService) {
    // this.iconService.fetchFromIconfont({
    //   scriptUrl: 'https://at.alicdn.com/t/font_2879102_dgzdvy8za0i.js'
    // })
  }

  ngOnInit(): void {
  }

 
  panels1 = [
    {
      active: false,
      disabled: false,
      name: '编译运行'
    }
  ];
  panels = [
    {
      active: true,
      disabled: false,
      name: '常用功能'
    }
  ];
  panels2 = [
    {
      active: false,
      disabled: false,
      name: '代码大纲'
    }
  ];

  async run() {
    const code = this.editorService.getCode();
    const token = await this.compileService.interactiveCompile(code);
    if (token === null) return;
    this.executeService.create(token);
  }
}
