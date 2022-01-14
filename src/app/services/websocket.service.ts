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
import { Observable, Observer, Subject } from 'rxjs';

export class WebsocketWrapper {

  private ws: WebSocket;
  private subject = new Subject<string>();
  receiver = this.subject.asObservable();
  sender: Observer<string>;

  constructor(private url: string) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = async (e) => this.subject.next(await e.data.text());
    this.ws.onerror = (e) => this.subject.error(e);
    this.ws.onclose = () => this.subject.complete();

    this.sender = {
      next: (data: string) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(data);
        } else {
          this.ws.onopen = () => this.ws.send(data);
        }
      },
      error: (err: any) => this.ws.close(1000, err),
      complete: () => this.ws.close(1000)
    };
    
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
