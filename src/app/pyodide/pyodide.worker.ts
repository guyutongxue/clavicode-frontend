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
import type { PyodideRemote } from "./type";

importScripts('https://cdn.jsdelivr.net/pyodide/dev/full/pyodide.js');
declare let loadPyodide: any;

const Self: any = self;

async function loadPyodideAndPackages(inCb: () => void, outCb: (s: string) => void, errCb: (s: string) => void) {
  Self.pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/dev/full/",
    stdin: inCb,
    stdout: outCb,
    stderr: errCb
  });
  // await Self.pyodide.loadPackage(["numpy", "pytz"]);
}

const decoder = new TextDecoder();

async function setIo(inCb: () => void, inBuf: Uint8Array, inMeta: Int32Array, outCb: (s: string) => void, errCb: (s: string) => void) {
  const inputCallback = () => {
    inCb();
    while (true) {
      if (Atomics.wait(inMeta, 1, 0, 50) === "timed-out") {
        // Check EOF?
      } else {
        break;
      }
    }
    Atomics.store(inMeta, 1, 0);
    const size = Atomics.exchange(inMeta, 0, 0);
    const bytes = inBuf.slice(0, size);
    return decoder.decode(bytes);
  }
  await loadPyodideAndPackages(inputCallback, outCb, errCb);
  console.log(Self.pyodide);
}

async function runCode(code: string) {
  try {
    await Self.pyodide.loadPackagesFromImports(code);
    let result = await Self.pyodide.runPythonAsync(code);
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

Comlink.expose(<PyodideRemote>{ setIo, runCode });
