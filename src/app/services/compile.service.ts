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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CppCompileRequest, CppCompileResponse , GccDiagnostics } from '../api';
import { NzNotificationDataOptions, NzNotificationService } from 'ng-zorro-antd/notification';
import { EditorService } from './editor.service';
import { ProblemsService } from './problems.service';
import { Router } from '@angular/router';
import { PyodideService } from './pyodide.service';
import { of, Subscription } from 'rxjs';
import { catchError, take, timeout } from 'rxjs/operators';

const COMPILE_URL = `//${environment.backendHost}/cpp/compile`;

@Injectable({
  providedIn: 'root'
})
export class CompileService {

  private notifyOption: NzNotificationDataOptions = {
    nzDuration: 3000
  };

  stdin: string = "";

  constructor(private http: HttpClient, private editorService: EditorService,
              private router: Router,
              private notification: NzNotificationService,
              private problemsService: ProblemsService,
              private pyodideService: PyodideService
              ) {
  }

  private code() {
    return this.editorService.getCode();
  }

  async fileCompile() {
    const lang = this.editorService.getLanguage();
    if (lang === "cpp") {
      const result = await this.http.post<CppCompileResponse>(COMPILE_URL, <CppCompileRequest>{
        code: this.code(),
        execute: 'file',
        stdin: this.stdin
      }).toPromise();
      if (result.status !== 'ok') {
        this.showError(result);
        return null;
      }
      if (result.execute !== 'file') {
        alert("non file response");
        return null;
      }
      if (result.result !== 'ok') {
        alert(`RE: ${result.reason}`);
      }
      return result.stdout;
    } else if (lang === "python") {
      const subscriptions: Subscription[] = []
      const stdinLines = this.stdin.split("\n");
      let stdout = "";
      subscriptions.push(this.pyodideService.readRequest.subscribe(() => {
        if (stdinLines.length > 0) {
          this.pyodideService.readResponse.next(stdinLines.shift());
        } else {
          this.pyodideService.readResponse.next(null);
        }
      }));
      subscriptions.push(this.pyodideService.writeRequest.subscribe((v) => {
        stdout += v;
        this.pyodideService.writeResponse.next();
      }));
      this.pyodideService.runCode(this.editorService.getCode(), false);
      const result = await this.pyodideService.closed.pipe(
        take(1),
        timeout(1000),
        catchError(e => of(e as Error)),
      ).toPromise();
      if (result !== null) {
        this.notification.error("运行错误", result.message);
      }
      subscriptions.forEach(s => s.unsubscribe());
      return stdout;
    } else {
      return null;
    }
  }

  async interactiveCompile() {
    const result = await this.http.post<CppCompileResponse>(COMPILE_URL, <CppCompileRequest>{
      code: this.code(),
      execute: 'interactive'
    }).toPromise();
    if (result.status !== 'ok') {
      this.showError(result);
      return null;
    }
    if (result.execute !== 'interactive') {
      alert("non interactive response");
      return null;
    }
    return result.executeToken;
  }

  async debugCompile(): Promise<string | null> {
    if (this.editorService.getLanguage() !== "cpp") return null;
    const result = await this.http.post<CppCompileResponse>(COMPILE_URL, <CppCompileRequest>{
      code: this.code(),
      execute: 'debug'
    }).toPromise();
    if (result.status !== 'ok') {
      this.showError(result);
      return null;
    }
    if (result.execute !== 'debug') {
      alert("non debug response");
      return null;
    }
    return result.debugToken;
  }

  private async showError(res: CppCompileResponse) {
    console.log("Compile result: ", res);
      if (res.status ==='ok') {
        if (res.error.length === 0) {
          this.notification.success("编译成功", "", this.notifyOption);
          this.problemsService.linkerr.next("");
          this.problemsService.problems.next([]);
        } else {
          this.showProblems(res.error);
          this.notification.warning("编译成功，但存在警告", "", this.notifyOption);
        }
      } else {
        switch (res.errorType) {
          case "compile":
            this.showProblems(res.error);
            this.notification.error("编译错误", "", this.notifyOption);
            break;
          case "link":
            // this.showProblems(result.error);
            this.notification.error("链接错误", "", this.notifyOption);
            break;
          default:
            this.showOutput(res);
            this.notification.error("未知错误", "" ,this.notifyOption);
            break;
        }
      }


    return;
  }

  private showOutput(result : CppCompileResponse) {
    this.router.navigate([{
      outlets: {
        tools: 'output'
      }
    }]);
   /*
   todo maybe add this part?
   */
  }

  private showProblems(diagnostics: GccDiagnostics) {
    this.router.navigate([{
      outlets: {
        tools: 'problems'
      }
    }]);
    this.problemsService.problems.next(diagnostics);
  }
  
}
