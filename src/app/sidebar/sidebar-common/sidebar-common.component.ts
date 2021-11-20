import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { ExecuteService } from '../../services/execute.service';
import { Router } from '@angular/router';
import { CompileService } from '../../services/compile.service';
import { EditorService } from '../../services/editor.service';
import { DialogService } from '@ngneat/dialog';
import { MainViewComponent } from '../../main-view/main-view.component';
import { ActionService } from 'src/app/services/action.service';
@Component({
  selector: 'app-sidebar-common',
  templateUrl: './sidebar-common.component.html',
  styleUrls: ['./sidebar-common.component.scss']
})
export class SidebarCommonComponent implements OnInit {

  readonly interactiveCompileAction = this.actionService.actions['compile.interactive'];

  constructor(private actionService: ActionService) {
  }

  ngOnInit(): void {
  }

}
