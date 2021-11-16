import { Component, OnInit } from '@angular/core';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { ExecuteService } from '../../services/execute.service';
import { Router } from '@angular/router';
import { CompileService } from '../../services/compile.service';
import { EditorService } from '../../services/editor.service';
import { DialogService } from '@ngneat/dialog';
import { MainViewComponent } from '../../main-view/main-view.component';

@Component({
  selector: 'app-output',
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.scss']
})
export class OutputComponent implements OnInit {

  constructor(private router: Router,
    private dialogService: DialogService,
    private executeService: ExecuteService, 
    private compileService: CompileService,
    private editorService: EditorService) {
    // this.iconService.fetchFromIconfont({
    //   scriptUrl: 'https://at.alicdn.com/t/font_2879102_dgzdvy8za0i.js'
    // })
  }

  stdin: string = "";
  stdout: string = "";

  ngOnInit(): void {
  }

}
