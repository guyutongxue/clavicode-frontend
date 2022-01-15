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
import { CHUNK_SIZE, FS_PATCH_LINENO, MAX_PATH } from '../pyodide/fs.worker';
import { FileLocalService } from './file-local.service';

const INPUT_BUF_SIZE = 128 * 1024;
const encoder = new TextEncoder();

/**
 * Make stdout "unbuffered".
 * 
 * Override sys.stdout, with write redefined:
 * - If the string to be written is ends with newline, then 
 *   output the original string.
 * - Else, add an extra newline to the end, with a special
 *   character `\xff` as a mark.
 * 
 * Pyodide only call `stdout(str)` when a newline is produced.
 * So the above strategy make every write to stdout is 
 * observable. When a line output ends with `\xff`, then should 
 * not print a newline with it.
 */
const STDOUT_UNBUFFER_PATCH = `
def patch_stdout():
    import sys
    class Wrapper:
        def write(self, s: str):
            if (s.endswith('\\n')):
                return sys.__stdout__.write(s)
            else:
                return sys.__stdout__.write(s + '\\xff\\n')
    sys.stdout = Wrapper()
patch_stdout()
del patch_stdout
`;
const STDOUT_UNBUFFER_PATCH_LINENO = STDOUT_UNBUFFER_PATCH.match(/\n/g)?.length ?? 0;

export interface ILocalTermService {
  readRequest: Subject<void>;
  /** Responsing `null` for EOF. */
  readResponse: Subject<string | null>;
  writeRequest: Subject<string>;
  writeResponse: Subject<void>;

  /** Emit value when Ctrl-C. */
  // interrupt: Subject<void>;

  /** Emit value when code execution complete. */
  closed: Subject<string | null>;
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
  closed = new Subject<string | null>();

  enableUnbufferPatch = true;

  private initPromise: Promise<void>;

  constructor(
    private statusService: StatusService,
    private dialogService: DialogService,
    private flService: FileLocalService,
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
    };
    await this.worker.init(
      Comlink.proxy(inputCb),
      this.inputBuffer,
      this.inputMeta,
      Comlink.proxy((s) => {
        if (this.enableUnbufferPatch && s.endsWith('\xff')) {
          this.output(s.substring(0, s.length - 1));
        } else {
          this.output(s + '\n');
        }
      }),
      Comlink.proxy((s) => this.output(s + '\n')),
      this.interruptBuffer
    );
    this.initFs();
  }

  async runCode(code: string, showDialog = true) {
    await this.initPromise;
    this.interruptBuffer[0] = 0;
    this.statusService.next('local-executing');
    if (showDialog) {
      this.openDialog();
    }
    if (this.enableUnbufferPatch) {
      code = STDOUT_UNBUFFER_PATCH + code;
    }
    const result = await this.worker.runCode(code);
    if (result.success) {
      this.close();
    } else {
      // Correct line numbers
      let SHIFT_LINENO = FS_PATCH_LINENO;
      if (this.enableUnbufferPatch) {
        SHIFT_LINENO += STDOUT_UNBUFFER_PATCH_LINENO;
      }
      let errorMsg: string = result.error.message;
      const regex = /File "<exec>", line (\d+)/g;
      let match = regex.exec(errorMsg);
      while (match !== null) {
        const line = parseInt(match[1]) - SHIFT_LINENO;
        errorMsg = errorMsg.replace(match[0], `File "<exec>", line ${line}`);
        match = regex.exec(errorMsg);
      }
      this.close(errorMsg);
    }
  }

  private close(result: string | null = null) {
    this.statusService.next('ready');
    this.interruptBuffer[0] = 2;
    // Wait for all stdout printed.
    // TODO: Any better solution?
    setTimeout(() => this.closed.next(result), 100);
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

  //
  // File system
  //

  private fsRDataBuffer = new Uint8Array(new SharedArrayBuffer(CHUNK_SIZE));
  private fsRMetaBuffer = new Int32Array(new SharedArrayBuffer(3 * Int32Array.BYTES_PER_ELEMENT + MAX_PATH));
  private fsWDataBuffer = new Uint8Array(new SharedArrayBuffer(CHUNK_SIZE));
  private fsWMetaBuffer = new Int32Array(new SharedArrayBuffer(3 * Int32Array.BYTES_PER_ELEMENT + MAX_PATH));

  private decoder = new TextDecoder();
  private encoder = new TextEncoder();

  private async fsRead(path: string, offset: number): Promise<[number, Uint8Array | null]> {
    return this.flService.readRaw(path, offset);
  }

  private initFs() {
    const getFilePath = (metaBuffer: Int32Array) => {
      let path = "";
      for (let i = 0; ; i++) {
        const int32 = metaBuffer[3 + Math.floor(i / 4)];
        const int8 = (int32 >> ((i % 4) * 8)) & 0xff;
        if (int8 === 0) break;
        path += String.fromCharCode(int8);
      }
      return path;
    };
    const readCallback = () => {
      const path = getFilePath(this.fsRMetaBuffer);
      const offset = this.fsRMetaBuffer[2];
      console.log("readCallback", "path", path);
      console.log("readCallback", "offset", offset);
      this.fsRead(path, offset).then(([size, buffer]) => {
        this.fsRMetaBuffer[1] = size;
        if (buffer !== null) {
          const writeSize = Math.min(size, CHUNK_SIZE);
          this.fsRDataBuffer.set(buffer.subarray(0, writeSize), 0);
        }
        Atomics.store(this.fsRMetaBuffer, 0, 1);
        Atomics.notify(this.fsRMetaBuffer, 0);
      });
    };
    const writeCallback = () => {
      const path = getFilePath(this.fsWMetaBuffer);
      const len = this.fsWMetaBuffer[1];
      const offset = this.fsWMetaBuffer[2];
      const data = new Uint8Array(new ArrayBuffer(len));
      console.log(data);
      data.set(this.fsWDataBuffer.subarray(0, len), 0);
      this.flService.writeRaw(path, offset, data).then(result => {
        this.fsWMetaBuffer[1] = result;
        Atomics.store(this.fsWMetaBuffer, 0, 1);
        Atomics.notify(this.fsWMetaBuffer, 0);
      });
    };
    this.worker.initFs(
      this.fsRDataBuffer,
      this.fsRMetaBuffer,
      Comlink.proxy(readCallback),
      this.fsWDataBuffer,
      this.fsWMetaBuffer,
      Comlink.proxy(writeCallback)
    );
  }

}
