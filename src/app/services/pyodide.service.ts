import { Injectable } from '@angular/core';
import { PyodideRemote } from '../pyodide/type';
import * as Comlink from 'comlink';

const INPUT_BUF_SIZE = 128 * 1024;
const encoder = new TextEncoder();


@Injectable({
  providedIn: 'root'
})
export class PyodideService {

  worker: Comlink.Remote<PyodideRemote>;

  constructor() {
    if (typeof Worker === 'undefined') throw Error("Web worker not supported");

    const worker = new Worker(new URL('../pyodide/pyodide.worker.ts', import.meta.url));
    this.worker = Comlink.wrap(worker);
    this.init();
  }

  private inputBuffer = new Uint8Array(new SharedArrayBuffer(INPUT_BUF_SIZE));
  // [ len, hasWritten ]
  private inputMeta = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2));

  async input(): Promise<string> {
    return prompt() ?? "";
  }

  async initIo() {
    const inputCb = () => {
      this.input().then((str) => {
        let bytes = encoder.encode(str);
        if (bytes.length > this.inputBuffer.length) {
          alert("Input is too long");
          bytes = bytes.slice(0, this.inputBuffer.length);
        }
        this.inputBuffer.set(bytes, 0);
        Atomics.store(this.inputMeta, 0, bytes.length);
        Atomics.store(this.inputMeta, 1, 1);
        Atomics.notify(this.inputMeta, 1);
      });
    }
    await this.worker.setIo(
      Comlink.proxy(inputCb),
      this.inputBuffer,
      this.inputMeta,
      Comlink.proxy((s) => console.log("!" + s)),
      Comlink.proxy(console.error));
  }

  async init() {

    await this.initIo();
    this.worker.runCode('print(1 + 2)');
  }
}
