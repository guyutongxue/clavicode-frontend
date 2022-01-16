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

/// <reference lib="webworker" />

import * as Comlink from 'comlink';
import { FS_PATCH } from './constants';
import { openLocal, closeLocal } from './fs.worker';
import type { PyodideRemote, SelfType } from "./type";

const PYODIDE_VERSION = "v0.19.0";

importScripts(`https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/pyodide.js`);
declare let loadPyodide: any;

const Self: SelfType = self as any;

const decoder = new TextDecoder();

async function init(
  inCb: () => void,
  inBuf: Uint8Array,
  inMeta: Int32Array,
  outCb: (s: string) => void,
  errCb: (s: string) => void,
  int: Uint8Array) {
  const inputCallback = () => {
    inCb();
    Atomics.wait(inMeta, 1, 0);
    Atomics.store(inMeta, 1, 0);
    const size = Atomics.exchange(inMeta, 0, 0);
    if (size === -1) return null;
    const bytes = inBuf.slice(0, size);
    const line = decoder.decode(bytes);
    return line;
  };
  Self.pyodide = await loadPyodide({
    indexURL: `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`,
    stdin: inputCallback,
    stdout: outCb,
    stderr: errCb
  });
  Self.pyodide.setInterruptBuffer(int);
  // await Self.pyodide.loadPackage(["numpy", "pytz"]);
  console.log(Self.pyodide);
}

export function initFs(
  readDataBuffer: Uint8Array,
  readMetaBuffer: Int32Array,
  readCallback: () => void, 
  writeDataBuffer: Uint8Array,
  writeMetaBuffer: Int32Array,
  writeCallback: () => void) {
  Self.pyodide.FS.mkdir('/mnt');
  Self.pyodide.FS.mkdir('/mnt/local');
  Self.fsRDataBuffer = readDataBuffer;
  Self.fsRMetaBuffer = readMetaBuffer;
  Self.fsWDataBuffer = writeDataBuffer;
  Self.fsWMetaBuffer = writeMetaBuffer;
  Self.fsWCallback = writeCallback;
  Self.fsRCallback = readCallback;
  Self['open_local'] = (path: string, mode: string) => { const r = openLocal(path, mode); console.log(r); return r; };
  Self['close_local'] = (path: string, data: any) => closeLocal(path, data.toJs());
}

async function runCode(code: string) {
  try {
    await Self.pyodide.loadPackagesFromImports(code);
    const globals = Self.pyodide.toPy({});
    code = FS_PATCH + code;
    let result = await Self.pyodide.runPythonAsync(code, globals);
    return {
      success: true,
      result
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

Comlink.expose(<PyodideRemote>{ init, initFs, runCode });
