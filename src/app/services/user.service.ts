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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoginPageComponent } from '../login-page/login-page.component';
import { RegisterPageComponent } from '../register-page/register-page.component';
import { UserGetInfoResponse } from '../api';

export interface userInfo_t {
  nickname: string,
  username: string;
  email: string | undefined,
  status: string,
  authorized: Map<string, string[]> | undefined;
}

@Injectable({
  providedIn: 'root'
})

export class UserService {

  userInfo = new BehaviorSubject<null | userInfo_t>(null);

  get isLoggedIn() {
    return this.userInfo.value !== null;
  }

  constructor(private http: HttpClient, private modal: NzModalService) {
    this.updateUserInfo();
    this.userInfo.subscribe((v) => console.log("userinfo: ", v));
  }

  login() {
    this.modal.create({
      nzTitle: '',
      nzContent: LoginPageComponent,
      nzWidth: '400px',
      nzFooter: null
    });
  }

  register() {
    this.modal.create({
      nzTitle: '',
      nzContent: RegisterPageComponent,
      nzWidth: '400px',
      nzFooter: null
    });
  }

  updateUserInfo() {
    this.http.get<UserGetInfoResponse>(`//${environment.backendHost}/user/getInfo`, {
      withCredentials: true
    }).subscribe((res) => {
      if (res.success) {
        this.userInfo.next({
          nickname: res.nickname,
          username: res.username,
          email: res.email,
          status: res.status,
          authorized: res.authorized
        });
      } else {
        this.userInfo.next(null);
      }
    });
  }

  

  logout() {
    this.http.get<any>(`//${environment.backendHost}/user/logout`, {
      withCredentials: true
    }).subscribe((res) => {
      this.userInfo.next(null);
    });
  }

}
