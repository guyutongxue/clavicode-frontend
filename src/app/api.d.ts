import { GdbResponse } from 'tsgdbmi';

interface GccDiagnosticPosition {
  file: string;
  line: number;
  column: number;
  "display-column"?: number;
  "byte-column"?: number;
}
interface GccDiagnosticLocation {
  label?: string;
  caret: GccDiagnosticPosition;
  start?: GccDiagnosticPosition;
  finish?: GccDiagnosticPosition;
}
interface GccDiagnosticFixit {
  start: GccDiagnosticPosition;
  next: GccDiagnosticPosition;
  string: string;
}
interface GccDiagnosticEvent {
  depth: number;
  description: string;
  function: string;
  location: GccDiagnosticPosition;
}
interface GccDiagnostic {
  kind: "note" | "warning" | "error";
  message: string;
  option?: string;
  option_url?: string;
  locations: GccDiagnosticLocation[];
  fixits?: GccDiagnosticFixit[];
  path?: GccDiagnosticEvent[];
  children?: GccDiagnostic[];
}
export type GccDiagnostics = GccDiagnostic[];

export type RuntimeError = 'timeout' | 'memout' | 'violate' | 'system' | 'other';

export type CppCompileRequest = {
  code: string;
  execute: 'none' | 'file' | 'interactive' | 'debug';
  stdin?: string;         // If execute is 'file'
};
export type CppCompileResponse =
  CppCompileErrorResponse |
  CppCompileNoneResponse |
  CppCompileFileResponse |
  CppCompileInteractiveResponse |
  CppCompileInteractiveResponse |
  CppCompileDebugResponse;

export type CppCompileErrorResponse = {
  status: 'error';
  errorType: 'compile' | 'link' | 'other';
  error: GccDiagnostics | string;
};

type CppCompileOkResponseBase<T extends CppCompileRequest.execute> = {
  status: 'ok';
  execute: T;
  error: GccDiagnostics;
}

export type CppCompileNoneResponse = CppCompileOkResponseBase<'none'>;

export type FileExecutionResult = ({
  result: 'ok';
  exitCode: number;
} | {
  result: 'error';
  reason: RuntimeError;
}) & {
  stdout: string;
  stderr: string;
};
export type CppCompileFileResponse = FileExecutionResult & CppCompileOkResponseBase<'file'>;

export type CppCompileInteractiveResponse = {
  executeToken: string;
  expireDate: string;
} & CppCompileOkResponseBase<'interactive'>;

export type CppCompileDebugResponse = {
  debugToken: string;
  expireDate: string;
} & CppCompileOkResponseBase<'debug'>;

export type WsExecuteC2S = {
  type: 'start';
} | {
  type: 'shutdown';
} | {
  type: 'eof';
} | {
  type: 'tin';
  content: string;
};
export type WsExecuteS2C = {
  type: 'started';
} | {
  type: 'closed';
  exitCode: number;
} | {
  type: 'error';
  reason: RuntimeError;
} | {
  type: 'tout';
  content: string;
}

type WsDebugGdbC2S = {
  type: 'start';
} | {
  type: 'request';
  request: string;
} | {
  type: 'tin';
  content: string;
} | {
  type: 'shutdown';
};
type WsDebugGdbS2C = {
  type: 'started';
  sourceFilePath: string;
} | {
  type: 'closed';
  exitCode: number;
} | {
  type: 'error';
  reason: RuntimeError;
} | {
  type: 'response';
  response: GdbResponse;
} | {
  type: 'tout';
  content: string;
};

export type CppGetHeaderFileRequest = {
  path: string;
};
export type CppGetHeaderFileResponse = {
  success: true;
  content: string;
} | {
  success: false;
  reason: string;
}
