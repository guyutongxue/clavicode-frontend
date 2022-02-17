import { Component, OnInit } from '@angular/core';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { ExecuteService } from '../../services/execute.service';
import { Router } from '@angular/router';
import { CompileService } from '../../services/compile.service';
import { EditorService } from '../../services/editor.service';
import { DialogService } from '@ngneat/dialog';
@Component({
  selector: 'app-sidebar-debug',
  templateUrl: './sidebar-debug.component.html',
  styleUrls: ['./sidebar-debug.component.scss']
})
export class SidebarDebugComponent implements OnInit {

  constructor(private router: Router,
    private dialogService: DialogService,
    private executeService: ExecuteService, 
    private compileService: CompileService,
    private editorService: EditorService) {
  }

  ngOnInit(): void {
  }
  panels = [
    {
      active: false,
      disabled: false,
      name: '变量查看'
    }
  ];
 
  panels1 = [
    {
      active: false,
      disabled: false,
      name: '表达式求值'
    }
  ];
  
  panels2 = [
    {
      active: false,
      disabled: false,
      name: '调用栈'
    }
  ];

}
