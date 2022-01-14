// Copyright (C) 2021 Clavicode Team
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
import { listen, MessageConnection } from 'vscode-ws-jsonrpc';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { MonacoEditorLoaderService } from '@gytx/ngx-monaco-editor';
import { MonacoLanguageClient, CloseAction, ErrorAction, MonacoServices, createConnection } from '@codingame/monaco-languageclient';
import { DocumentSymbol, SemanticTokens } from 'vscode-languageserver-protocol';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, take } from 'rxjs/operators';

import { Tab } from './tabs.service';
import { cppLang, cppLangConf } from '../configs/cpp';
import { pyLang, pyLangConf } from '../configs/py';
import { environment } from '../../environments/environment';
import { basename, extname } from 'path';

// All standard C++ headers filename
// Generate on https://eel.is/c++draft/headerindex, run js below:
/*
Array.from(document.querySelectorAll("span.texttt"))
  .map(i => i.innerHTML)
  .filter(i => /^&lt;[^.]*&gt;/g.test(i))
  .map(i => i.substring(4, i.length - 4).replace(/\uad/, ''))
*/
const stdCppHeaders = ['algorithm', 'any', 'array', 'atomic', 'barrier', 'bit', 'bitset', 'cassert', 'cctype', 'cerrno', 'cfenv', 'cfloat', 'charconv', 'chrono', 'cinttypes', 'climits', 'clocale', 'cmath', 'codecvt', 'compare', 'complex', 'concepts', 'condition_variable', 'coroutine', 'csetjmp', 'csignal', 'cstdarg', 'cstddef', 'cstdint', 'cstdio', 'cstdlib', 'cstring', 'ctime', 'cuchar', 'cwchar', 'cwctype', 'deque', 'exception', 'execution', 'filesystem', 'format', 'forward_list', 'fstream', 'functional', 'future', 'initializer_list', 'iomanip', 'ios', 'iosfwd', 'iostream', 'istream', 'iterator', 'latch', 'limits', 'list', 'locale', 'map', 'memory', 'memory_resource', 'mutex', 'new', 'numbers', 'numeric', 'optional', 'ostream', 'queue', 'random', 'ranges', 'ratio', 'regex', 'scoped_allocator', 'semaphore', 'set', 'shared_mutex', 'source_location', 'span', 'spanstream', 'sstream', 'stack', 'stacktrace', 'stdexcept', 'stop_token', 'streambuf', 'string', 'string_view', 'strstream', 'syncstream', 'system_error', 'thread', 'tuple', 'type_traits', 'typeindex', 'typeinfo', 'unordered_map', 'unordered_set', 'utility', 'valarray', 'variant', 'vector', 'version']

function getLanguage(path: string) {
  if (extname(path) === '' && stdCppHeaders.includes(basename(path))) {
    return 'cpp';
  } else {
    return undefined;
  }
}

const clangdSemanticTokensLegend: monaco.languages.SemanticTokensLegend = {
  tokenModifiers: [], // No token modifier supported now (12.0.0-rc1)
  // See https://github.com/llvm/llvm-project/blob/4dc8365/clang-tools-extra/clangd/SemanticHighlighting.h#L30
  tokenTypes: [
    "variable.global",         // Global var
    "variable.local",          // Local var
    "variable.param",          // Param
    "function",                // Function (global)
    "function.member",         // Member function
    "function.member.static",  // Static member function
    "variable.member",         // Member data
    "variable.member.static",  // Static member data
    "type.class",              // Class type
    "type.enum",               // Enum type
    "number.enum",             // Enum member
    "type",                    // Type-alias (rely on template)
    "type",                    // Other type
    "",                        // Unknown
    "type.namespace",          // Namespace
    "type.param",              // Template param
    "type.concept",            // Concept
    "type",                    // Primitive type (type-alias)
    "macro",                   // Macro
    "comment"                  // Inactive Code
  ]
};

interface EditorBreakpointDecInfo {
  id: string;
  hitCount: number | null;
  expression: string | null;
}

export interface EditorBreakpointInfo extends EditorBreakpointDecInfo {
  line: number;
}

interface ModelInfo {
  cursor: monaco.IPosition;
  scrollTop: number;
  readonly readOnly: boolean;
  bkptDecs: EditorBreakpointDecInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  isInit = false;
  editorMessage: Subject<{ type: string; arg?: any }> = new Subject();

  // Root path of local files
  private localPath = '/anon_workspace/';

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private languageClient: Record<string, MonacoLanguageClient | null> = {
    cpp: null,
    python: null
  };
  private editorText = new BehaviorSubject<string>("");
  editorText$ = this.editorText.asObservable();

  private modelInfos: { [uri: string]: ModelInfo } = {};
  private breakpointInfos = new BehaviorSubject<EditorBreakpointInfo[]>([]);
  breakpointInfos$ = this.breakpointInfos.asObservable();

  private traceDecoration: string[] = [];
  private lastTraceUri: monaco.Uri | null = null;

  constructor(private monacoEditorLoaderService: MonacoEditorLoaderService) {
    this.editorText.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((_) => {
      const model = this.editor?.getModel();
      if (model) {
        this.updateBkptInfo(model);
      }
    });

    this.monacoEditorLoaderService.isMonacoLoaded$.pipe(
      filter(isLoaded => isLoaded),
      take(1)
    ).subscribe(() => {
      monaco.languages.register({
        id: 'cpp',
        extensions: [
          '.cc', '.cxx', '.cpp', '.h', '.hpp'
        ],
        aliases: ['C++', 'Cpp', 'cpp']
      });
      monaco.languages.setMonarchTokensProvider('cpp', cppLang);
      monaco.languages.setLanguageConfiguration('cpp', cppLangConf);
      monaco.languages.register({
        id: 'python',
        extensions: ['.py'],
        aliases: ['Python']
      });
      monaco.languages.setMonarchTokensProvider('python', pyLang);
      monaco.languages.setLanguageConfiguration('python', pyLangConf);
      monaco.languages.registerDocumentSemanticTokensProvider('cpp', {
        getLegend() {
          return clangdSemanticTokensLegend;
        },
        provideDocumentSemanticTokens: async (model: monaco.editor.ITextModel) => {
          return {
            data: new Uint32Array(await this.getSemanticTokens(model))
          };
        },
        releaseDocumentSemanticTokens() { }
      });
      MonacoServices.install(monaco as any);

      this.startLanguageClient('cpp');
      this.startLanguageClient('python');
    });
  }

  private startLanguageClient(lang: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${environment.backendHost}/ws/languageServer/${lang}`;
    const socketOptions = {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 10000,
      maxRetries: 8,
      debug: false
    };
    const webSocket = new ReconnectingWebSocket(socketUrl, [], socketOptions) as any;
    let client: MonacoLanguageClient;
    // listen when the web socket is opened
    listen({
      webSocket,
      onConnection: (connection: MessageConnection) => {
        // create and start the language client
        client = new MonacoLanguageClient({
          name: `${lang} client`,
          clientOptions: {
            // use a language id as a document selector
            documentSelector: [lang],
            // disable the default error handler
            errorHandler: {
              error: () => ErrorAction.Continue,
              closed: () => CloseAction.DoNotRestart
            }
          },
          // create a language client connection from the JSON RPC connection on demand
          connectionProvider: {
            get: (errorHandler, closeHandler) => {
              return Promise.resolve(createConnection(<any>connection, errorHandler, closeHandler));
            }
          }
        });
        const disposable = client.start();
        // When client is ready, assign it to global
        client.onReady().then(() => this.languageClient[lang] = client);
        connection.onClose(() => {
          this.languageClient[lang] = null;
          disposable?.dispose();
        });
      }
    });
  }

  private getUri(tab: Tab): monaco.Uri {
    if (tab.type === "local") {
      return monaco.Uri.file(this.localPath + tab.path);
    } else {
      return monaco.Uri.file(tab.path);
    }
  }

  /** Turn breakpoint info to editor decoration */
  private bkptInfoToDecoration(line: number): monaco.editor.IModelDeltaDecoration {
    return {
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      options: {
        isWholeLine: true,
        className: 'bkpt-line-decoration',
        glyphMarginClassName: 'bkpt-glyph-margin codicon codicon-circle-filled',
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    };
  }

  // https://github.com/microsoft/monaco-editor/issues/2195#issuecomment-711471692
  private addMissingActions() {
    if (this.editor === null) return;
    this.editor.addAction({
      id: 'undo',
      label: 'Undo',
      run: () => {
        if (this.editor === null) return;
        this.editor.focus();
        (this.editor.getModel() as any).undo();
      },
    });
    this.editor.addAction({
      id: 'redo',
      label: 'Redo',
      run: () => {
        if (this.editor === null) return;
        this.editor.focus();
        (this.editor.getModel() as any).redo();
      },
    });
    this.editor.addAction({
      id: 'editor.action.clipboardCutAction',
      label: 'Cut',
      run: () => {
        if (this.editor === null) return;
        this.editor.focus();
        document.execCommand('cut');
      },
    });
    this.editor.addAction({
      id: 'editor.action.clipboardCopyAction',
      label: 'Copy',
      run: () => {
        if (this.editor === null) return;
        this.editor.focus();
        document.execCommand('copy');
      },
    });
    this.editor.addAction({
      id: 'editor.action.clipboardPasteAction',
      label: 'Paste',
      run: () => {
        if (this.editor === null) return;
        this.editor.focus();
        document.execCommand('paste');
      },
    });
    // https://github.com/microsoft/monaco-editor/issues/2010
    this.editor.addAction({
      id: 'editor.action.selectAll',
      label: 'Select All',
      run: () => {
        if (this.editor === null) return;
        const model = this.editor.getModel();
        if (model === null) return;
        this.editor.focus();
        this.editor.setSelection(model.getFullModelRange());
      }
    });
  }

  // https://github.com/microsoft/monaco-editor/issues/2000
  private interceptOpenEditor() {
    const editorService = (this.editor as any)._codeEditorService;
    const openEditorBase = editorService.openCodeEditor.bind(editorService);
    editorService.openCodeEditor = async (input: { options: any, resource: monaco.Uri }, source: any) => {
      const result = await openEditorBase(input, source);
      if (result === null) {
        const selection: monaco.IRange = input.options?.selection;
        this.editorMessage.next({
          type: "requestOpen",
          arg: {
            selection: selection ?? ({ startColumn: 1, startLineNumber: 1, endColumn: 1, endLineNumber: 1 } as monaco.IRange),
            path: input.resource.path
          }
        });
      }
      return result;
    };
  }

  private mouseDownListener = (e: monaco.editor.IEditorMouseEvent) => {
    // Add or remove breakpoints
    if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
      const currentModel = this.editor?.getModel() ?? null;
      if (currentModel === null) return;
      const lineNumber = e.target.range?.startLineNumber ?? 1;
      const uri = currentModel.uri.toString();
      const index = this.modelInfos[uri].bkptDecs.findIndex(v =>
        currentModel.getDecorationRange(v.id)?.startLineNumber === lineNumber
      );
      if (index !== -1) {
        currentModel.deltaDecorations([this.modelInfos[uri].bkptDecs[index].id], []);
        this.modelInfos[uri].bkptDecs.splice(index, 1);
      } else {
        this.modelInfos[uri].bkptDecs.push({
          id: currentModel.deltaDecorations([], [this.bkptInfoToDecoration(lineNumber)])[0],
          hitCount: null,
          expression: null
        });
      }
      this.updateBkptInfo(currentModel);
    }
  };

  editorInit(editor: monaco.editor.IStandaloneCodeEditor): void {
    monaco.editor.setTheme('mytheme');
    this.editor = editor;
    this.interceptOpenEditor();
    this.addMissingActions();
    this.editor.onMouseDown(this.mouseDownListener);
    this.editor.onDidChangeModel((e) => {
      if (e.newModelUrl === null) return;
      this.editorText.next(monaco.editor.getModel(e.newModelUrl)?.getValue() ?? "");
    });
    this.isInit = true;
    this.editorMessage.next({ type: "initCompleted" });
  }

  editorDestroy(): void {
    this.editorText.next("");
    this.editor = null;
    this.isInit = false;
  }

  setEditorTheme(theme: monaco.editor.IStandaloneThemeData): void {
    if (this.monacoEditorLoaderService.isMonacoLoaded$.value) {
      monaco.editor.defineTheme('mytheme', theme);
      monaco.editor.setTheme('mytheme');
      return;
    }
    this.monacoEditorLoaderService.isMonacoLoaded$.pipe(
      filter(isLoaded => isLoaded),
      take(1)
    ).subscribe(() => {
      monaco.editor.defineTheme('mytheme', theme);
      monaco.editor.setTheme('mytheme');
    });
  }

  switchToModel(tab: Tab, replace = false): void {
    if (this.editor === null) return;
    const uri = this.getUri(tab);
    const newUri = uri.toString();
    let newModel = monaco.editor.getModel(uri);
    const oldModel = this.editor.getModel();
    const oldUri = oldModel?.uri.toString();
    if (newUri === oldUri) return;
    if (oldUri && oldUri in this.modelInfos) {
      this.modelInfos[oldUri].cursor = this.editor.getPosition() ?? { column: 1, lineNumber: 1 };
      this.modelInfos[oldUri].scrollTop = this.editor.getScrollTop();
    }
    if (newModel === null) {
      newModel = monaco.editor.createModel(tab.code, getLanguage(tab.path), uri);
      newModel.onDidChangeContent(_ => {
        if (tab.type === "local" && tab.saved) {
          tab.saved = false;
        }
        this.editorText.next(newModel!.getValue());
      });
      this.modelInfos[newUri] = {
        cursor: { column: 1, lineNumber: 1 },
        scrollTop: 0,
        readOnly: tab.type === "remote",
        bkptDecs: [],
      };
      if (replace && oldModel !== null && oldUri) {
        // "Inherit" old decorations to new model
        for (const bkptInfo of this.modelInfos[oldUri].bkptDecs) {
          const line = oldModel.getDecorationRange(bkptInfo.id)?.startLineNumber ?? 1;
          this.modelInfos[newUri].bkptDecs.push({
            id: newModel.deltaDecorations([], [this.bkptInfoToDecoration(line)])[0],
            expression: bkptInfo.expression,
            hitCount: bkptInfo.hitCount
          });
        }
        this.modelInfos[newUri].cursor = this.modelInfos[oldUri].cursor;
        this.modelInfos[newUri].scrollTop = this.modelInfos[oldUri].scrollTop;
        delete this.modelInfos[oldUri];
      }
    }
    this.editor.setModel(newModel);
    console.log('switch to ', newUri);
    if (replace) {
      oldModel?.dispose();
    }
    this.editor.updateOptions({ readOnly: this.modelInfos[newUri].readOnly });
    this.setPosition(this.modelInfos[newUri].cursor);
    this.editor.setScrollTop(this.modelInfos[newUri].scrollTop);
  }

  async getSymbols(): Promise<DocumentSymbol[]> {
    if (!this.isInit || this.editor === null) return [];
    const model = this.editor.getModel();
    if (model === null) return [];
    const client = this.languageClient[model.getLanguageId()];
    if (client === null) return [];
    return client.sendRequest("textDocument/documentSymbol", {
      textDocument: {
        uri: model.uri.toString()
      }
    });
  }

  private async getSemanticTokens(model?: monaco.editor.ITextModel): Promise<number[]> {
    if (!this.isInit || this.editor === null) return [];
    const targetModel = model ?? this.editor.getModel();
    if (targetModel === null) return [];
    const client = this.languageClient[targetModel.getLanguageId()];
    if (client === null) return [];
    return client.sendRequest<SemanticTokens>("textDocument/semanticTokens/full", {
      textDocument: {
        uri: targetModel.uri.toString()
      }
    }).then(res => res.data);
  }

  /**
   * Get the code in current editor model.
   * @returns Code. "" if no model available.
   */
  getCode() {
    if (!this.isInit || this.editor === null) return "";
    return this.editor.getValue();
  }

  /** Get the language id of current editor model. */
  getLanguage() {
    if (!this.isInit || this.editor === null) return null;
    return this.editor.getModel()?.getLanguageId() ?? null;
  }
  setSelection(range: monaco.IRange) {
    if (this.editor === null) return;
    setTimeout(() => this.editor?.setSelection(range), 3);
    this.editor.revealRange(range);
    this.editor.focus();
  }
  setPosition(position: monaco.IPosition) {
    if (this.editor === null) return;
    // Set position seems doesn't work if called immediately.
    // Call it after 3ms. I don't know why
    setTimeout(() => this.editor?.setPosition(position), 3);
    this.editor.revealLine(position.lineNumber);
    this.editor.focus();
  }

  runAction(id: string) {
    if (!this.isInit || this.editor === null) return;
    this.editor.getAction(id).run();
  }

  destroy(tab: Tab) {
    const uri = this.getUri(tab);
    console.log('destroy ', uri.toString());
    const target = monaco.editor.getModel(uri);
    delete this.modelInfos[uri.toString()];
    if (this.lastTraceUri === uri) this.lastTraceUri = null;
    target?.dispose();
  }

  private updateBkptInfo(model: monaco.editor.ITextModel) {
    const uri = model.uri.toString();
    if (uri in this.modelInfos)
      this.breakpointInfos.next(this.modelInfos[uri].bkptDecs.map(dec => ({
        line: model.getDecorationRange(dec.id)?.startLineNumber ?? 1,
        ...dec
      })));
  }

  changeBkptCondition(id: string, expression: string) {
    if (this.editor === null) return;
    const currentModel = this.editor.getModel();
    if (currentModel === null) return;
    const targetDec = this.modelInfos[currentModel.uri.toString()].bkptDecs.find(v => v.id === id);
    if (typeof targetDec === "undefined") return;
    targetDec.expression = expression;
    this.updateBkptInfo(currentModel);
  }

  showTrace(line: number) {
    if (this.editor === null) return;
    this.hideTrace();
    const currentModel = this.editor.getModel();
    if (currentModel === null) return;
    this.traceDecoration = currentModel.deltaDecorations(this.traceDecoration, [{
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      options: {
        isWholeLine: true,
        className: 'trace-line-decoration',
        glyphMarginClassName: 'trace-glyph-margin codicon codicon-debug-stackframe',
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    }]);
    this.lastTraceUri = currentModel.uri;
    this.editor.revealLine(line);
  }
  hideTrace() {
    if (this.lastTraceUri !== null)
      monaco.editor.getModel(this.lastTraceUri)?.deltaDecorations(this.traceDecoration, []);
    this.traceDecoration = [];
  }
}
