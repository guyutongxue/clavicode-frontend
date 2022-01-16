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

import { SelfType } from "./type";
import { MAX_PATH, CHUNK_SIZE, MT_PATH, MT_OFFSET, MT_DONE, MT_LEN, MT_CREATE, C_EXCLUSIVE, C_CREATE, C_NONE, E_MAX_PATH } from './constants';

/// <reference lib="webworker" />

type OpenLocalResult = {
  success: false;
  errno: number;
} | {
  success: true;
  data: Uint8Array;
}

const Self: SelfType = self as any;

function fillPathToMeta(path: string, buffer: Int32Array) {
  buffer.fill(0, MT_PATH);
  for (let i = 0; i < path.length; i++) {
    buffer[MT_PATH + Math.floor(i / 4)] |= path.charCodeAt(i) << (8 * (i % 4));
  }
}

export function openLocal(path: string, mode: string): OpenLocalResult {
  if (path.length > MAX_PATH) {
    return {
      success: false,
      errno: E_MAX_PATH
    };
  }
  const dataBuf = Self.fsRDataBuffer;
  const metaBuf = Self.fsRMetaBuffer;
  fillPathToMeta(path, metaBuf);
  let create: number;
  if (mode.includes('x')) {
    create = C_EXCLUSIVE;
  } else if (mode.includes('w') || mode.includes('a')) {
    create = C_CREATE;
  } else {
    create = C_NONE;
  }
  let offset = 0;                         // current read position
  metaBuf[MT_CREATE] = create;
  metaBuf[MT_OFFSET] = offset;
  Self.fsRCallback();                     // read from local fs
  Atomics.wait(metaBuf, MT_DONE, 0);      // wait for read to finish
  Atomics.store(metaBuf, MT_DONE, 0);     // reset
  let len = metaBuf[MT_LEN];
  if (len < 0) {
    return { success: false, errno: len };
  }
  const resultBuf = new Uint8Array(len);
  while (len > CHUNK_SIZE) {
    resultBuf.set(dataBuf, offset);       // copy chunk
    len -= CHUNK_SIZE;
    offset += CHUNK_SIZE;
    metaBuf[MT_CREATE] = create;
    metaBuf[MT_OFFSET] = offset;          // update offset
    Self.fsRCallback();                   // read from local fs
    Atomics.wait(metaBuf, MT_DONE, 0);    // wait for read to finish
    Atomics.store(metaBuf, MT_DONE, 0);   // reset
  }
  resultBuf.set(dataBuf.subarray(0, len), offset); // copy last chunk
  return { success: true, data: resultBuf };
}

export function closeLocal(path: string, data: Uint8Array): number {
  if (path.length > MAX_PATH) {
    return E_MAX_PATH;
  }
  const dataBuf = Self.fsWDataBuffer;
  const metaBuf = Self.fsWMetaBuffer;
  fillPathToMeta(path, metaBuf);
  let len = data.length;
  let offset = 0;
  let result = 0;
  while (len > CHUNK_SIZE) {
    metaBuf[MT_LEN] = CHUNK_SIZE;
    metaBuf[MT_OFFSET] = offset;
    console.log({ len, offset });
    dataBuf.set(data.subarray(offset, offset + CHUNK_SIZE)); // copy chunk
    Self.fsWCallback();                  // write to local fs
    Atomics.wait(metaBuf, MT_DONE, 0);
    Atomics.store(metaBuf, MT_DONE, 0);
    if (metaBuf[MT_LEN] < 0) {
      return metaBuf[MT_LEN];
    }
    result += metaBuf[MT_LEN];
    len -= CHUNK_SIZE;
    offset += CHUNK_SIZE;
  }
  metaBuf[MT_LEN] = len;
  metaBuf[MT_OFFSET] = offset;
  console.log({ len, offset });
  dataBuf.set(data.subarray(offset));     // copy last chunk
  Self.fsWCallback();                     // write to local fs
  Atomics.wait(metaBuf, MT_DONE, 0);      // wait for read to finish
  Atomics.store(metaBuf, MT_DONE, 0);     // reset
  if (metaBuf[MT_LEN] < 0) {
    return metaBuf[MT_LEN];
  }
  result += metaBuf[MT_LEN];
  return result;
}
