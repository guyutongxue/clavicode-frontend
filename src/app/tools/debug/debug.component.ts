import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { ActionService } from 'src/app/services/action.service';
import { CompileService } from 'src/app/services/compile.service';
import { DebugService, FrameInfo } from 'src/app/services/debug.service';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss']
})
export class DebugComponent implements OnInit {


  @ViewChild("cOutput") private cOutput!: ElementRef ;

  constructor(
    private actionService: ActionService,
    private compileService: CompileService,
    private debugService: DebugService) {}
  
  expr = "";

  isDebugging: boolean = false;

  exprVal = "";

  consoleOutput$: Observable<string> = this.debugService.consoleOutput$;
  promptColor = "#262626";
  consoleInput = "";
  consoleInputEnabled = true;

  // bkptList: FrameInfo[] = [];

  currentEditBkptline: number | null = null;
  currentEditValue = "";

  get enabled(): boolean {
    return true;
  }

  getEditorBreakpoints() {
    return this.debugService.editorBkptList;
  }

  ngOnInit(): void {
    this.consoleOutput$;
    this.actionService.status.subscribe(status => {
      if (status === 'debugging') {
        this.isDebugging = true;
      } else {
        this.isDebugging = false;
      }
    });
  }

  ngAfterViewChecked(): void {
    try {
      this.cOutput.nativeElement.scrollTop = this.cOutput.nativeElement.scrollHeight;
    } catch (_) {
      //
    }
  }

  async startDebug() {
    const token = await this.compileService.debugCompile();
    if (token !== null) {
      this.debugService.create(token);
    }
  }

  exitDebug() {
    this.debugService.close();
  }

  async sendCommand() {
    this.consoleInputEnabled = false;
    const result = await this.debugService.sendCommand(this.consoleInput);
    this.consoleInputEnabled = true;
    this.consoleInput = "";
    if (result.message !== "error") this.promptColor = "green";
    else this.promptColor = "red";
  }

  debugContinue() {
    this.debugService.debugContinue();
  }
  debugStepover() {
    this.debugService.debugStepover();
  }
  debugStepinto() {
    this.debugService.debugStepinto();
  }
  debugStepout() {
    this.debugService.debugStepout();
  }
  debugRestart() {
    // NEED REMOVAL
  }

  async evalExpr() {
    this.exprVal = await this.debugService.evalExpr(this.expr);
  }

}
