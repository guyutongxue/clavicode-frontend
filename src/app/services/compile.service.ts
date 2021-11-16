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
import { CppCompileRequest, CppCompileResponse } from '../api';

const COMPILE_URL = `//${environment.backendHost}/cpp/compile`;

@Injectable({
  providedIn: 'root'
})
export class CompileService {


  constructor(private http: HttpClient) { 
  }

  async fileCompile(code: string, stdin: string) {
    const result = await this.http.post<CppCompileResponse>(COMPILE_URL, <CppCompileRequest>{
      code: code,
      execute: 'file',
      stdin: stdin
    }).toPromise();
    if (result.status !== 'ok') {
      alert(result.error);
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
  }

  async interactiveCompile(code: string) {
    const result = await this.http.post<CppCompileResponse>(COMPILE_URL, <CppCompileRequest>{
      code: code,
      execute: 'interactive'
    }).toPromise();
    if (result.status !== 'ok') {
      alert(result.error);
      return null;
    }
    if (result.execute !== 'interactive') {
      alert("non interactive response");
      return null;
    }
    return result.executeToken;
  }
}
