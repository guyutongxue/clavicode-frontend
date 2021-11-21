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
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { UserLoginResponse } from '../api';
import { ActionService } from '../services/action.service';
import { environment } from 'src/environments/environment';
import { UserService } from '../services/user.service';


@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {
  validateForm: FormGroup;
  checked = true;


  submitForm(): void {
    if (this.validateForm.valid) {
      console.log('submit', this.validateForm.value);
      this.http.post<UserLoginResponse>(`//${environment.backendHost}/user/login`, this.validateForm.value, {
        withCredentials: true
      }).subscribe((res) => {
        if (res.success) {
          this.modalRef.close();
          this.userService.updateUserInfo();
        } else {
          alert("error" + res.reason)
        }
      });
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  constructor(
    private fb: FormBuilder,
    private modalRef: NzModalRef, 
    private http: HttpClient,
    private actionService: ActionService,
    private userService: UserService) {
    this.validateForm = this.fb.group({
      email: [null, [Validators.required]],
      password: [null, [Validators.required]],
      remember: [true]
    });
  }

  ngOnInit(): void {
  }

  register() {
    this.modalRef.close();
    this.actionService.runAction('user.register');
  }

}
