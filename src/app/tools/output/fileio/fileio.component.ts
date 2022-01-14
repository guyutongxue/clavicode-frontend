import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompileService } from '../../../services/compile.service';
import { StatusService } from 'src/app/services/status.service';

@Component({
  selector: 'app-fileio',
  templateUrl: './fileio.component.html',
  styleUrls: ['./fileio.component.scss']
})
export class FileioComponent implements OnInit {

  constructor(private router: Router,
    private compileService: CompileService,
    private statusService: StatusService) {
  }


  ngOnInit(): void {
  }

  get stdin() {
    return this.compileService.stdin;
  }
  set stdin(value: string) {
    this.compileService.stdin = value;
  }

  get enabled() {
    return this.statusService.value === 'ready';
  }
  
  stdout: string = "";
  async compile() {
    this.stdout = await this.compileService.fileCompile() ?? "";
  }
}
