import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CppCompileRequest, CppCompileResponse } from '../api';

const HOST = environment.production ? location.host : "localhost:3000";
const COMPILE_URL = `//${HOST}/cpp/compile`;

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
      return;
    }
    if (result.execute !== 'file') {
      alert("non file response");
      return;
    }
    if (result.result !== 'ok') {
      alert(`RE: ${result.reason}`);
    }
    return result.stdout;
  }
}
