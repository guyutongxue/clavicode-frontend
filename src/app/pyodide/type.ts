export type PyodideRemote = {
  setIo(inCb: () => void, inBuf: Uint8Array, inMeta: Int32Array, outCb: (s: string) => void, errCb: (s: string) => void): void;
  runCode(code: string): any;
}
