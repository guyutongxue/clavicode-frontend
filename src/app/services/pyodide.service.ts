// Copyright (C) 2022 Clavicode Team
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
import { PyodideRemote } from '../pyodide/type';
import * as Comlink from 'comlink';
import { Subject } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { DialogService } from '@ngneat/dialog';
import { ExecuteDialogComponent } from '../execute-dialog/execute-dialog.component';
import { terminalWidth } from '../execute-dialog/xterm/xterm.component';
import { StatusService } from './status.service';

const INPUT_BUF_SIZE = 128 * 1024;
const encoder = new TextEncoder();

export interface ILocalTermService {
  readRequest: Subject<void>;
  /** Responsing `null` for EOF. */
  readResponse: Subject<string | null>;
  writeRequest: Subject<string>;
  writeResponse: Subject<void>;

  /** Emit value when Ctrl-C. */
  // interrupt: Subject<void>;
  
  /** Emit value when code execution complete. */
  closed: Subject<Error | null>;
}

@Injectable({
  providedIn: 'root'
})
export class PyodideService implements ILocalTermService {

  worker: Comlink.Remote<PyodideRemote>;

  readRequest = new Subject<void>();
  readResponse = new Subject<string | null>();
  writeRequest = new Subject<string>();
  writeResponse = new Subject<void>();
  // interrupt = new Subject<void>();
  closed = new Subject<Error | null>();

  private initPromise: Promise<void>;

  constructor(
    private statusService: StatusService,
    private dialogService: DialogService
  ) {
    if (typeof Worker === 'undefined') throw Error("Web worker not supported");

    const worker = new Worker(new URL('../pyodide/pyodide.worker.ts', import.meta.url));
    this.worker = Comlink.wrap(worker);
    this.initPromise = this.initIo();
    // this.interrupt.subscribe(() => {
    //   // https://pyodide.org/en/stable/usage/keyboard-interrupts.html
    //   // 2 represents SIGINT
    //   this.interruptBuffer[0] = 2;
    // });
  }

  private inputBuffer = new Uint8Array(new SharedArrayBuffer(INPUT_BUF_SIZE));
  // [ input_len, written ]
  private inputMeta = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2));

  private interruptBuffer = new Uint8Array(new SharedArrayBuffer(1));

  private async input(): Promise<string | null> {
    const r = this.readResponse.pipe(
      take(1)
    ).toPromise();
    this.readRequest.next();
    return r;
  }

  private async output(str: string) {
    const r = this.writeResponse.pipe(
      take(1)
    ).toPromise();
    this.writeRequest.next(str);
    return r;
  }

  private async initIo() {
    const inputCb = () => {
      this.input().then((str) => {
        if (str === null) {
          Atomics.store(this.inputMeta, 0, -1);
        } else {
          let bytes = encoder.encode(str);
          if (bytes.length > this.inputBuffer.length) {
            alert("Input is too long");
            bytes = bytes.slice(0, this.inputBuffer.length);
          }
          this.inputBuffer.set(bytes, 0);
          Atomics.store(this.inputMeta, 0, bytes.length);
        }
        Atomics.store(this.inputMeta, 1, 1);
        Atomics.notify(this.inputMeta, 1);
      });
    }
    await this.worker.init(
      Comlink.proxy(inputCb),
      this.inputBuffer,
      this.inputMeta,
      Comlink.proxy((s) => this.output(s + '\n')),
      Comlink.proxy((s) => this.output(s + '\n')),
      this.interruptBuffer
    );
  }

  async runCode(code: string, showDialog = true) {
    await this.initPromise;
    this.interruptBuffer[0] = 0;
    this.statusService.next('local-executing');
    if (showDialog) {
      this.openDialog();
    }
    const result = await this.worker.runCode(code);
    if (result.success) {
      this.close();
    } else {
      this.close(result.error);
    }
  }

  private close(result: Error | null = null) {
    this.statusService.next('ready');
    this.interruptBuffer[0] = 2;
    this.closed.next(result);
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

}
