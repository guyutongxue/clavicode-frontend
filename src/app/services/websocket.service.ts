import { Injectable } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs';

export class WebsocketWrapper {

  private ws: WebSocket;
  private subject = new Subject<string>();
  receiver = this.subject.asObservable();
  sender: Observer<string>;

  constructor(private url: string) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (e) => this.subject.next(e.data);
    this.ws.onerror = (e) => this.subject.error(e);
    this.ws.onclose = () => this.subject.complete();

    this.sender = {
      next: (data: string) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(data);
        }
      },
      error: (err: any) => this.ws.close(1000, err),
      complete: () => this.ws.close(1000)
    }
    
    console.log("Successfully connected: ", url);
  }


};


@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  constructor() { }

  create(url: string): WebsocketWrapper {
    return new WebsocketWrapper(url);
  }

}
