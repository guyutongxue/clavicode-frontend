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
  setIo(inCb: () => void, inBuf: Uint8Array, inMeta: Int32Array, outCb: (s: string) => void, errCb: (s: string) => void): void;
  runCode(code: string): Promise<PyodideExecutionResult>;
}
