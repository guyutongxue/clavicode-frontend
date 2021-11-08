import { Injectable } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { WebsocketService } from './websocket.service';
import { WsExecuteC2S, WsExecuteS2C } from '../api';
import { DialogService } from '@ngneat/dialog';
import { ExecuteDialogComponent } from '../execute-dialog/execute-dialog.component';
import { terminalWidth } from '../execute-dialog/xterm/xterm.component';

// export const TEMP_EXECUTE_TOKEN = "0344a132-6e41-46c9-81b1-08fcb795b0cd";
// const EXECUTE_URL = `ws://${environment.backendHost}/ws/execute/${TEMP_EXECUTE_TOKEN}`;

@Injectable({
  providedIn: 'root'
})
export class ExecuteService {
  public sender: Observer<WsExecuteC2S> | null = null;
  public receiver: Observable<WsExecuteS2C> | null = null;

  constructor(
    private dialogService: DialogService,
    private wsService: WebsocketService) {

  }

  create(token: string) {
    if (this.sender !== null || this.receiver !== null) {
      throw new Error('Connection already established');
    }
    const EXECUTE_URL =  `ws://${environment.backendHost}/ws/execute/${token}`;
    const wrapper = this.wsService.create(EXECUTE_URL);
    this.sender = {
      next: (data: WsExecuteC2S) => wrapper.sender.next(JSON.stringify(data)),
      error: (err: any) => wrapper.sender.error(err),
      complete: () => wrapper.sender.complete()
    }
    this.receiver = wrapper.receiver.pipe(
      tap(console.log),
      map((data) => JSON.parse(data) as WsExecuteS2C)
    );
    this.sender.next({
      type: 'start'
    })
    this.receiver.subscribe((data) => {
      if (data.type === 'closed') this.close();
    })
    this.openDialog();
  }

  private openDialog() {
    const ref = this.dialogService.open(ExecuteDialogComponent, {
      draggable: false,
      width: `${terminalWidth()}px`,
      dragConstraint: 'constrain'
    });
    ref.afterClosed$.subscribe(() => {
      this.close();
    });
  }

  close() {
    if (this.sender === null) return;
    this.sender.complete();
    this.sender = null;
    this.receiver = null;
  }

}
