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
import { map, tap } from 'rxjs/operators';
import { BehaviorSubject, EMPTY, firstValueFrom, Observable, Observer, Subject, throwError, TimeoutError } from 'rxjs';
import { GdbArray, GdbResponse, GdbVal } from '@gytx/tsgdbmi';
import { environment } from 'src/environments/environment';
import { EditorBreakpointInfo, EditorService } from './editor.service';
import { FileService } from './file.service';
import { catchError, debounceTime, filter, switchMap, timeout } from 'rxjs/operators';
import { WebsocketService } from './websocket.service';
import { WsDebugGdbC2S, WsDebugGdbS2C } from '../api';

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

export class DebugService {
    public sender: Observer<WsDebugGdbC2S> | null = null;
    public receiver: Observable<WsDebugGdbS2C> | null = null;

    isDebugging$ = new BehaviorSubject(false);

    private allOutput = "";
    private consoleOutput: BehaviorSubject<string> = new BehaviorSubject("");
    consoleOutput$: Observable<string> = this.consoleOutput.asObservable();

    private sourcePath: string | undefined;
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
        private fileService: FileService,
        private editorService: EditorService,
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

      create(token: string) {
        if (this.sender !== null || this.receiver !== null) {
          throw new Error('Debugging already established');
        }
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const EXECUTE_URL =  `${protocol}//${environment.backendHost}/ws/execute/${token}`;
        const wrapper = this.wsService.create(EXECUTE_URL);
        this.sender = {
          next: (data: WsDebugGdbC2S) => wrapper.sender.next(JSON.stringify(data)),
          error: (err: any) => wrapper.sender.error(err),
          complete: () => wrapper.sender.complete(),
        }
        this.receiver = wrapper.receiver.pipe(
          tap(console.log),
          map((data) => JSON.parse(data) as WsDebugGdbS2C)
        );
        this.sender.next({
           type: 'start' 
        })


        this.receiver.subscribe((data) => {
          if (data.type === 'started') this.start();
          if (data.type === 'closed') this.close();
          if (data.type === 'error') this.close();
          if (data.type === 'response') this.close();
          if (data.type === 'tout') this.close();
        })
        
      }

    close() {
    if (this.sender === null) return;
    this.sender.complete();
    this.sender = null;
    this.receiver = null;
    }

    async start() {
      this.consoleOutput.next("");
        for (const breakInfo of this.initBreakpoints) {
          if(this.sourcePath)
          {
            await this.sendMiRequest(`-break-insert ${this.bkptConditionCmd(breakInfo)} "${escape(this.sourcePath)}:${breakInfo.line}"`);
          }
          
        }
        this.router.navigate([{
          outlets: {
            tools: 'debug'
          }
        }]);
        await this.sendMiRequest("-exec-run");
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
        const token = Math.floor(Math.random() * 1000000);
        this.sender?.next({
          type: 'request' ,
          request: `${token}${command}`
        });
        return firstValueFrom(this.requestResults.pipe(
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
          })
        ));
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
      debugRestart() {
        return this.sendMiRequest("-exec-run");
      }

      async evalExpr(expr: string): Promise<string> {
        const result = await this.sendMiRequest(`-data-evaluate-expression "${escape(expr)}"`);
        if (result.message !== "error") {
          return result.payload["value"];
        } else {
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
          return (result.payload["stack"] as GdbArray).map<FrameInfo>((value: { [x: string]: string; }) => ({
            file: value["file"],
            line: Number.parseInt(value["line"]),
            func: value["func"],
            level: Number.parseInt(value["level"])
          }));
        } else {
          return Promise.reject(result.payload["msg"]);
        }
      }
    
      async getLocalVariables(): Promise<GdbArray> {
        if (!this.isDebugging$.value) return [];
        const result = await this.sendMiRequest("-stack-list-variables --all-values");
        if (result.message !== "error") {
          return result.payload["variables"];
        } else {
          return Promise.reject(result.payload["msg"]);
        }
      }
    
      private isVariableExpandable(x: GdbVal) {
        return !!(x["dynamic"] ?? x["numchild"] !== "0");
      }
    
    
      async getVariableChildren(variableId: string): Promise<GdbVarInfo[]> {
        if (!this.isDebugging$.value) return [];
        const result = await this.sendMiRequest(`-var-list-children --all-values ${variableId}`);
        if (result.message === "error") return Promise.reject();
        const children = result.payload["children"] as GdbArray;
        if (typeof children === "undefined") return [];
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
        const changeList = result.payload["changelist"] as GdbArray;
        for (const change of changeList) {
          if (change["in_scope"] !== "true") {
            deleteList.push(change["name"]);
            continue;
          }
          if (change["new_num_children"]) {
            collapseList.push(change["name"]);
          }
          const target = origin.find(o => o.id === change["name"]);
          if(target)
          {
            target.value = change["value"];
          }
        }
        return { deleteList, collapseList };
      }
    
      deleteVariable(variableId: string, childrenOnly = false) {
        if (this.isDebugging$.value) this.sendMiRequest(`-var-delete ${childrenOnly ? '-c' : ''} ${variableId}`);
      }
      
  

  
  
    
  
   
}
