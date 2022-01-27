// Copyright (C) 2021 Clavicode Team
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


import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { first, map, tap } from 'rxjs/operators';
import { BehaviorSubject, EMPTY, Observable, Observer, Subject, throwError, TimeoutError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EditorBreakpointInfo, EditorService } from './editor.service';
import { FileService } from './file.service';
import { catchError, debounceTime, filter, switchMap, timeout } from 'rxjs/operators';
import { WebsocketService } from './websocket.service';
import { WsDebugGdbC2S, WsDebugGdbS2C } from '../api';
import {  GdbArray, GdbVal, GdbResponse } from '../api.debug';
import { DialogService } from '@ngneat/dialog';
import { terminalWidth } from '../execute-dialog/xterm/xterm.component';
import { ExecuteDialogComponent } from '../execute-dialog/execute-dialog.component';
import { IRemoteTermService } from './execute.service';
import { StatusService } from './status.service';


function escape(src: string) {
  return src.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
}

interface TraceLine { file: string; line: number }
export interface FrameInfo {
  file: string;
  line: number;
  func: string;
  level: number;
}

export interface BreakpointInfo {
  file: string;
  line: number;
  func?: string;
}

export interface GdbVarInfo {
  id: string;
  expression: string;
  value: string;
  expandable: boolean;
}



@Injectable({
  providedIn: 'root'
})

export class DebugService implements IRemoteTermService {
  public sender: Observer<WsDebugGdbC2S> | null = null;
  public receiver: Observable<WsDebugGdbS2C> | null = null;

  isDebugging$ = new BehaviorSubject(false);

  private allOutput = "";
  private consoleOutput = new BehaviorSubject<string>("");
  consoleOutput$: Observable<string> = this.consoleOutput.asObservable();

  private sourceFilePath: string = "";
  private initBreakpoints: EditorBreakpointInfo[] = [];

  // use this subject to set rate limit of "running"/"stopped" event.
  private traceLine: Subject<TraceLine | null> = new Subject();

  // private bkptList: Subject<BreakpointInfo[]> = new Subject();
  // bkptList$: Observable<BreakpointInfo[]> = this.bkptList.asObservable();
  editorBkptList: EditorBreakpointInfo[] = [];

  private requestResults: Subject<GdbResponse> = new Subject();

  programStop: Subject<void> = new Subject;
  localVariables$: Observable<GdbArray> = this.programStop.pipe(
    switchMap(() => this.getLocalVariables()),
    catchError(err => (alert(err), EMPTY))
  );
  callStack$: Observable<FrameInfo[]> = this.programStop.pipe(
    switchMap(() => this.getCallStack()),
    catchError(err => (alert(err), EMPTY))
  );



  constructor(
    private router: Router,
    private dialogService: DialogService,
    private fileService: FileService,
    private editorService: EditorService,
    private statusService: StatusService,
    private wsService: WebsocketService) {

    this.traceLine.pipe(
      debounceTime(100)
    ).subscribe(value => {
      if (value === null) this.editorService.hideTrace();
      else this.fileService.locate(value.file, value.line, 1, "debug");
    });

    this.editorService.breakpointInfos$.subscribe(value => {
      this.editorBkptList = value;
    });

  }

  async create(token: string) {
    if (this.sender !== null || this.receiver !== null) {
      throw new Error('Debugging already established');
    }
    this.statusService.next('debugging');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const EXECUTE_URL = `${protocol}//${environment.backendHost}/ws/debug/gdb/${token}`;
    const wrapper = this.wsService.create(EXECUTE_URL);
    this.sender = {
      next: (data: WsDebugGdbC2S) => wrapper.sender.next(JSON.stringify(data)),
      error: (err: any) => wrapper.sender.error(err),
      complete: () => wrapper.sender.complete(),
    };
    this.receiver = wrapper.receiver.pipe(
      map((data) => JSON.parse(data) as WsDebugGdbS2C)
    );
    // Do not send start. GDB will start on connection established.
    // await new Promise(r => setTimeout(r, 500));
    // this.sender.next({
    //   type: 'start'
    // })

    this.receiver.subscribe((data) => {
      if (data.type === 'started') {
        this.sourceFilePath = data.sourceFilePath;
        this.start();
      }
      else if (data.type === 'closed') this.close();
      else if (data.type === 'error') this.close();
      else if (data.type === 'response') {
        const r = data.response;
        if (r.type === 'notify') {
          if (r.message === "running") {
            // Program is running (continue or init start or restart)
            this.isDebugging$.next(true);
            this.traceLine.next(null);
          } else if (r.message === "stopped") {
            // @ts-ignore
            const reason = r.payload["reason"] as string;
            if (reason.startsWith("exited")) {
              // Program exited. Stop debugging
              this.sendMiRequest("-gdb-exit");
              this.close();
            } else if (["breakpoint-hit", "end-stepping-range", "function-finished"].includes(reason)) {
              // Program stopped during step-by-step debugging
              console.log(r.payload);
              // @ts-ignore
              const frame: any = r.payload["frame"];
              if ("fullname" in frame) {
                let stopFile = frame["fullname"] as string;
                if (stopFile === this.sourceFilePath) stopFile = '/tmp/main.cpp';
                const stopLine = Number.parseInt(frame["line"] as string);
                this.traceLine.next({ file: stopFile, line: stopLine });
                this.programStop.next();
              }
            }
          }
        } else if (r.type === 'result') {
          this.requestResults.next(r);
        } else if (r.type === 'console') {
          const newstr = r.payload as string;
          this.consoleOutput.next(this.allOutput += newstr);
        }
      }
    });

  }

  private openDialog() {
    const ref = this.dialogService.open(ExecuteDialogComponent, {
      draggable: true,
      width: `${terminalWidth()}px`,
      dragConstraint: 'constrain'
    });
    ref.afterClosed$.subscribe(() => {
      this.close();
    });
  }

  close() {
    if (this.sender === null) return;
    this.sender.complete();
    this.sender = null;
    this.receiver = null;

    this.traceLine.next(null);
    this.programStop.next();
    this.statusService.next('ready');
  }

  private async start() {
    this.consoleOutput.next("");
    this.initBreakpoints = this.editorBkptList;
    for (const breakInfo of this.initBreakpoints) {
      await this.sendMiRequest(`-break-insert ${this.bkptConditionCmd(breakInfo)} "${this.sourceFilePath}:${breakInfo.line}"`);
    }
    this.router.navigate([{ outlets: { tools: 'debug' } }], { skipLocationChange: true });
    this.openDialog();
    await this.sendMiRequest("-exec-continue");
  }

  private bkptConditionCmd(info: EditorBreakpointInfo) {
    const cmds: string[] = [];
    if (info.expression !== null) {
      cmds.push(`-c "${escape(info.expression)}"`);
    }
    if (info.hitCount !== null) {
      cmds.push(`-i ${info.hitCount}`);
    }
    return cmds.join(' ');
  }

  private sendMiRequest(command: string): Promise<GdbResponse> {
    const token = Math.floor(Math.random() * 999500) + 500;
    this.sender?.next({
      type: 'request',
      request: `${token}${command}`
    });
    console.log('token', token);
    return this.requestResults.pipe(
      tap(console.log),
      filter(result => result.token === token),
      timeout(2000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          window.alert("GDB 未响应。调试将退出。");
          this.close();
          return EMPTY;
        } else {
          return throwError(() => err);
        }
      }),
      first()
    ).toPromise();
  }



  sendCommand(command: string) {
    return this.sendMiRequest(`-interpreter-exec console "${escape(command)}"`);
  }

  debugContinue() {
    return this.sendMiRequest("-exec-continue");
  }
  debugStepover() {
    return this.sendMiRequest("-exec-next");
  }
  debugStepinto() {
    return this.sendMiRequest("-exec-step");
  }
  debugStepout() {
    return this.sendMiRequest("-exec-finish");
  }

  async evalExpr(expr: string): Promise<string> {
    const result = await this.sendMiRequest(`-data-evaluate-expression "${escape(expr)}"`);
    if (result.message !== "error") {
      // @ts-ignore
      return result.payload["value"];
    } else {
      // @ts-ignore
      return result.payload["msg"];
    }
  }

  changeBkptCondition(id: string, expression: string) {
    this.editorService.changeBkptCondition(id, expression);
  }

  locateEditorBreakpoint(line: number) {
    this.editorService.setPosition({
      lineNumber: line,
      column: 1
    });
  }

  async getCallStack(): Promise<FrameInfo[]> {
    if (!this.isDebugging$.value) return [];
    const result = await this.sendMiRequest("-stack-list-frames");
    if (result.message !== "error") {
      // @ts-ignore
      return (result.payload["stack"] as GdbArray).map<FrameInfo>((value: { [x: string]: string; }) => ({
        file: value["file"],
        line: Number.parseInt(value["line"]),
        func: value["func"],
        level: Number.parseInt(value["level"])
      }));
    } else {
      // @ts-ignore
      return Promise.reject(result.payload["msg"]);
    }
  }

  async getLocalVariables(): Promise<GdbArray> {
    if (!this.isDebugging$.value) return [];
    const result = await this.sendMiRequest("-stack-list-variables --all-values");
    if (result.message !== "error") {
      // @ts-ignore
      return result.payload["variables"];
    } else {
      // @ts-ignore
      return Promise.reject(result.payload["msg"]);
    }
  }

  private isVariableExpandable(x: GdbVal) {
    // @ts-ignore
    return !!(x["dynamic"] ?? x["numchild"] !== "0");
  }


  async getVariableChildren(variableId: string): Promise<GdbVarInfo[]> {
    if (!this.isDebugging$.value) return [];
    const result = await this.sendMiRequest(`-var-list-children --all-values ${variableId}`);
    if (result.message === "error") return Promise.reject();
    // @ts-ignore
    const children = result.payload["children"] as GdbArray;
    if (typeof children === "undefined") return [];
    // @ts-ignore
    return children.map((val: { [x: string]: any; }) => ({
      id: val["name"],
      expression: val["exp"],
      value: val["value"] ?? "",
      expandable: this.isVariableExpandable(val)
    }));
  }

  async updateVariables(origin: GdbVarInfo[]) {
    const deleteList: string[] = [];
    const collapseList: string[] = [];
    if (!this.isDebugging$.value) return { deleteList: origin.map(v => v.id), collapseList };
    const result = await this.sendMiRequest('-var-update --all-values *');
    if (result.message === "error") return { deleteList, collapseList };
    // @ts-ignore
    const changeList = result.payload["changelist"] as GdbArray;
    for (const change of changeList) {
      // @ts-ignore
      if (change["in_scope"] !== "true") {
        // @ts-ignore
        deleteList.push(change["name"]);
        continue;
      }
      // @ts-ignore
      if (change["new_num_children"]) {
        // @ts-ignore
        collapseList.push(change["name"]);
      }
      // @ts-ignore
      const target = origin.find(o => o.id === change["name"]);
      if (target) {
        // @ts-ignore
        target.value = change["value"];
      }
    }
    return { deleteList, collapseList };
  }

  deleteVariable(variableId: string, childrenOnly = false) {
    if (this.isDebugging$.value) this.sendMiRequest(`-var-delete ${childrenOnly ? '-c' : ''} ${variableId}`);
  }

}
