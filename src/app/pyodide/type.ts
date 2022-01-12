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

export type PyodideExecutionResult = {
  success: true,
  result: any
} | {
  success: false,
  error: any
}

export type PyodideRemote = {
  /**
   * 
   * @param inCb Callback when input requested
   * @param inBuf Write input value to this buffer
   * @param inMeta [ input_len | written ]
   * @param outCb Callback when a line is written to stdout
   * @param errCb Callback when a line is written to stderr
   * @param int Write '\0x2' to this buffer when Ctrl-C
   */
  init(
    inCb: () => void,
    inBuf: Uint8Array,
    inMeta: Int32Array,
    outCb: (s: string) => void,
    errCb: (s: string) => void,
    int: Uint8Array): void;
  runCode(code: string): Promise<PyodideExecutionResult>;
}
