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

/// <reference lib="webworker" />

type OpenLocalResult = {
  success: false,
  reason: string
} | {
  success: true,
  data: Uint8Array
}

const Self: SelfType = self as any;

export const FS_PATCH = `
__open = open
def patch_fs():
    from js import open_local, close_local
    from pathlib import Path
    import os
    PREFIX = '/mnt/local/'
    def patched_open(file, *args, **kwargs):
        if not isinstance(file, str):
            return __open(file, *args, **kwargs)
        path = Path(file).resolve()
        pathstr = str(path)
        if not pathstr.startswith(PREFIX):
            return __open(file, *args, **kwargs)
        res = open_local(pathstr[len(PREFIX):])
        if res.success:
            os.makedirs(str(path.parent), exist_ok=True)
            with __open(pathstr, 'wb') as pf:
                pf.write(res.data.to_py().tobytes())
        else:
            raise OSError("Failed to load %s from local fs. Reason: %s" % (file, res.reason))
        f = __open(file, *args, **kwargs)
        __close = f.close
        def patched_close():
            __close()
            with __open(pathstr, 'rb') as pf:
                data = pf.read()
                res = close_local(pathstr[len(PREFIX):], data)
                if res < 0:
                    raise OSError("Failed to store %s to local fs. Errno: %d" % (file, res))
        f.close = patched_close
        return f
    os.chdir(PREFIX)
    return patched_open
open = patch_fs()
del patch_fs
`;
export const FS_PATCH_LINENO = FS_PATCH.match(/\n/g)?.length ?? 0;

export const MAX_PATH = 256;
export const CHUNK_SIZE = 4096;

function fillPathToMeta(path: string, buffer: Int32Array) {
  buffer.fill(0, 3);
  for (let i = 0; i < path.length; i++) {
    buffer[3 + Math.floor(i / 4)] |= path.charCodeAt(i) << (8 * (i % 4));
  }

}

export function openLocal(path: string): OpenLocalResult {
  if (path.length > MAX_PATH) {
    return {
      success: false,
      reason: `Path is too long.`
    };
  }
  const dataBuf = Self.fsRDataBuffer;
  const metaBuf = Self.fsRMetaBuffer;
  fillPathToMeta(path, metaBuf);
  metaBuf[2] = 0;                         // offset = 0;
  Self.fsRCallback();                     // read
  Atomics.wait(metaBuf, 0, 0);            // wait for read to finish
  Atomics.store(metaBuf, 0, 0);           // reset
  let len = Atomics.exchange(metaBuf, 1, 0);
  if (len < 0) {
    return {
      success: false,
      reason: `errno ${len}`
    };
  }
  const resultBuf = new Uint8Array(len);
  let pos = 0;                            // current read position
  if (len <= CHUNK_SIZE) {
    resultBuf.set(dataBuf.subarray(0, len));
    return { success: true, data: resultBuf };
  }
  while (len > CHUNK_SIZE) {
    resultBuf.set(dataBuf, pos);          // copy chunk
    metaBuf[2] = pos;                     // offset = pos
    Self.fsRCallback();                   // read from local fs
    Atomics.wait(metaBuf, 0, 0);          // wait for read to finish
    Atomics.store(dataBuf, 0, 0);         // reset
    len -= CHUNK_SIZE;
    pos += CHUNK_SIZE;
  }
  resultBuf.set(dataBuf.subarray(0, len), pos); // copy last chunk
  return { success: true, data: resultBuf };
}

export function closeLocal(path: string, data: Uint8Array): number {
  const dataBuf = Self.fsWDataBuffer;
  const metaBuf = Self.fsWMetaBuffer;
  fillPathToMeta(path, metaBuf);
  let len = data.length;
  let pos = 0;
  metaBuf[1] = len;
  metaBuf[2] = pos;
  if (len <= CHUNK_SIZE) {
    dataBuf.set(data.subarray(0, len), pos);
    Self.fsWCallback();                     // write to local fs
    Atomics.wait(metaBuf, 0, 0);            // wait for read to finish
    Atomics.store(metaBuf, 0, 0);           // reset
    const result = Atomics.exchange(metaBuf, 1, len);
    return result;
  }
  while (len > 0) {
    metaBuf[1] = len;
    metaBuf[2] = pos;
    dataBuf.set(data, pos);
    Self.fsWCallback();
    Atomics.wait(metaBuf, 0, 0);
    Atomics.store(metaBuf, 0, 0);
    len -= CHUNK_SIZE;
    pos += CHUNK_SIZE;
  }
  const result = Atomics.exchange(metaBuf, 1, len);
  return result;
}
