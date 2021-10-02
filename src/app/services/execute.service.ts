import { Injectable } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { WebsocketService } from './websocket.service';

export interface Message {
  message: string;
}

const WS_URL = "ws://localhost:3000/socketTest"

@Injectable({
  providedIn: 'root'
})
export class ExecuteService {
  public sender: Observer<Message> | null = null;
  public receiver: Observable<Message> | null = null;

  constructor(private wsService: WebsocketService) { 
    
  }

  create() {
    if (this.sender !== null || this.receiver !== null) {
      throw new Error('Connection already established');
    }
    const wrapper = this.wsService.create(WS_URL);
    this.sender = {
      next: (data: Message) => wrapper.sender.next(JSON.stringify(data)),
      error: (err: any) => wrapper.sender.error(err),
      complete: () => wrapper.sender.complete()
    }
    this.receiver = wrapper.receiver.pipe(
      map((data) => JSON.parse(data) as Message)
    );
  }

  close() {
    if (this.sender === null) {
      throw new Error('Connection not established');
    }
    this.sender.complete();
    this.sender = null;
    this.receiver = null;
  }
}
