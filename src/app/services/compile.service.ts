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
