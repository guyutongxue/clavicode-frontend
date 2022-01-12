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

import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Inject, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { Terminal } from 'xterm';
import { ExecuteService, IRemoteTermService } from 'src/app/services/execute.service';
import { filter, map, timeout } from 'rxjs/operators';
import { LocalEchoAddon } from '@gytx/xterm-local-echo';

import { DebugService } from 'src/app/services/debug.service';
import { StatusService } from 'src/app/services/status.service';
import { ILocalTermService, PyodideService } from 'src/app/services/pyodide.service';

const TERM_FONT_FAMILY = `"等距更纱黑体 SC", "Cascadia Code", Consolas, "Courier New", Courier, monospace`;
const TERM_FONT_SIZE = 14;
const TERM_COLS = 80;
const TERM_ROWS = 25;

let _canvas: HTMLCanvasElement;
export function terminalWidth() {
  const canvas = _canvas ?? (_canvas = document.createElement('canvas'));
  const context = canvas.getContext('2d')!;
  context.font = `${TERM_FONT_SIZE}px ${TERM_FONT_FAMILY}`;
  const ratio = window.devicePixelRatio;
  return Math.floor(context.measureText('m').width * ratio) * TERM_COLS / ratio;
}

@Component({
  selector: 'app-xterm',
  templateUrl: './xterm.component.html',
  styleUrls: ['./xterm.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class XtermComponent implements OnInit {

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private statusService: StatusService,
    private executeService: ExecuteService,
    private pyodideService: PyodideService,
    private debugService: DebugService) { }

  @Output() close = new EventEmitter<void>();

  private readonly term = new Terminal({
    fontFamily: TERM_FONT_FAMILY,
    fontSize: TERM_FONT_SIZE,
    cols: TERM_COLS,
    rows: TERM_ROWS
  });

  private registerRemote(service: IRemoteTermService) {
    let closing = false;
    this.term.onData(data => {
      if (closing) {
        this.close.emit();
      } else {
        service.sender?.next({
          type: 'tin',
          content: data
        });
      }
    });
    service.receiver?.subscribe(data => {
      if (data.type === 'tout') {
        this.term.write(data.content);
      } else if (data.type === 'closed' || data.type === 'error') {
        this.term.write('\r\n----------\r\n');
        if (data.type === 'closed') {
          this.term.write(`运行结束，退出代码 ${(data.exitCode).toString()}。\r\n`);
        } else {
          if (data.reason === 'timeout') {
            this.term.write(`程序运行时间超出限制。\r\n`);
          } else if (data.reason === 'memout') {
            this.term.write(`程序运行内存超出限制。\r\n`);
          } else if (data.reason === 'violate') {
            this.term.write(`程序行为被禁止。\r\n`);
          } else if (data.reason === 'system') {
            this.term.write(`服务器异常，请及时联系我们。\r\n`);
          } else if (data.reason === 'other') {
            this.term.write(`程序因运行时错误终止。\r\n`);
          } else {
            this.term.write(`未知错误。\r\n`);
          }
        }
        this.term.write('按任意键关闭窗口。\r\n');
        closing = true;
      }
    })
  }

  private registerLocal(service: ILocalTermService) {
    const localEcho = new LocalEchoAddon({
      enableAutocomplete: false,
      enableIncompleteInput: false
    });
    this.term.loadAddon(localEcho);
    localEcho.onEof(() => {
      service.readResponse.next(null);
    });
    // localEcho.onInterrupt(() => {
    //   localEcho.abortRead();
    //   service.interrupt.next();
    // });
    service.readRequest.subscribe(async () => {
      const input = await localEcho.read("").catch(() => "");
      service.readResponse.next(input);
    });
    service.writeRequest.subscribe(async (str) => {
      await localEcho.print(str);
      // console.log(`OUTPUT: ${JSON.stringify(str)}`);
      service.writeResponse.next();
    })
    service.closed.subscribe(async (result) => {
      await localEcho.println("----------");
      if (result === null) {
        await localEcho.println("代码运行完成。\n按任意键关闭窗口。");
      } else {
        await localEcho.println("代码运行出错：");
        await localEcho.println(result.message);
        await localEcho.println("按任意键关闭窗口。");
      }
      localEcho.abortRead();
      await new Promise((resolve) => this.term.onData(resolve))
      this.close.emit();
    })
  }

  ngOnInit(): void {
    this.term.open(this.document.getElementById('executeXterm')!);
    this.term.focus();
    switch (this.statusService.value) {
      case 'debugging':
        this.registerRemote(this.debugService);
        break;
      case 'remote-executing':
        this.registerRemote(this.executeService);
        break;
      case 'local-executing':
        this.registerLocal(this.pyodideService);
        break;
      default:
        break;
    }
  }

}
