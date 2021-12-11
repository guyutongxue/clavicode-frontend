import { Component, OnInit } from '@angular/core';
import { ExecuteService } from '../../../services/execute.service';
import { Router } from '@angular/router';
import { CompileService } from '../../../services/compile.service';
import { EditorService } from '../../../services/editor.service';
import { DialogService } from '@ngneat/dialog';
import { NzUploadChangeParam } from 'ng-zorro-antd/upload';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-fileio',
  templateUrl: './fileio.component.html',
  styleUrls: ['./fileio.component.scss']
})
export class FileioComponent implements OnInit {

  constructor(public router: Router,
    public dialogService: DialogService,
    private executeService: ExecuteService, 
    private compileService: CompileService,
    private editorService: EditorService) {
  }


  ngOnInit(): void {
  }

  get stdin() {
    return this.compileService.stdin;
  }
  set stdin(value: string) {
    this.compileService.stdin = value;
  }
  

  stdout: string = "";
  async compile() {
    this.stdout = await this.compileService.fileCompile() ?? "";
  }
}
