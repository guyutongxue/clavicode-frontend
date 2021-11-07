import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { Terminal } from 'xterm';
import { ExecuteService } from 'src/app/services/execute.service';
import { filter, map } from 'rxjs/operators';

const TERM_FONT_FAMILY = `"等距更纱黑体 SC", "Cascadia Code", Consolas, "New Courier", monospace`;
const TERM_FONT_SIZE = 14;
const TERM_COLS = 80;
const TERM_ROWS = 25;

let _canvas: HTMLCanvasElement;
export function terminalWidth() {
  const canvas = _canvas ?? (_canvas = document.createElement('canvas'));
  const context = canvas.getContext('2d')!;
  context.font = `${TERM_FONT_SIZE}px ${TERM_FONT_FAMILY}`;
  return context.measureText('m').width * TERM_COLS;
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
    private executeService: ExecuteService) { }

  private readonly term = new Terminal({
    fontFamily: TERM_FONT_FAMILY,
    fontSize: TERM_FONT_SIZE,
    cols: TERM_COLS,
    rows: TERM_ROWS
  });

  ngOnInit(): void {
    this.term.open(this.document.getElementById('executeXterm')!);
    this.term.focus();
    this.term.onData(data => {
      this.executeService.sender?.next({
        type: 'tin',
        content: data
      });
    });
    this.executeService.receiver?.subscribe(data => {
      if (data.type === 'tout') {
        this.term.write(data.content);
      } else if (data.type === 'closed') {
        this.term.write('\r-------\rClosed.\r');
      }
    })
  }

}
