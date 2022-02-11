// Copyright (C) 2022 Clavicode Team
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
import { FormBuilder, FormGroup, Validators, FormControl, ValidationErrors } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { environment } from 'src/environments/environment';
import { UserRegisterResponse, UserSystemResponse } from '../api';
import { UserService } from '../services/user.service';
import { Observable, Observer } from 'rxjs';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss']
})
export class RegisterPageComponent implements OnInit {
  validateForm: FormGroup;
  checked = true;
  regPassword = /^(?=.*?[a-z])(?=.*?[0-9]).{6,}$/;

  submitForm(): void {
    if (this.validateForm.valid) {
      console.log('submit', this.validateForm.value);
      this.http.post<UserRegisterResponse>(`//${environment.backendHost}/user/register`,
        { 'password': this.validateForm.value.password, 'username': this.validateForm.value.username }).subscribe((res) => {
          if (res.success) {
            this.modalRef.close();
            this.userService.updateUserInfo();
          } else {
            alert("error: " + res.reason);
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

  userNameAsyncValidator = (control: FormControl) =>
    new Observable((observer: Observer<ValidationErrors | null>) => {
      setTimeout(() => {
        if (!control.value) {
          observer.next({ error: true, required: true });
          observer.complete();

        }
        else {
          this.http.get<UserSystemResponse>(`//${environment.backendHost}/user/search`, {params: {username: control.value, email: ""}}).subscribe(
            (res) => {
              console.log(res);
              if (res.success) {
                observer.next({ error: true, used: true });
              } else {
                observer.next(null);
              }
              observer.complete();
            }
          );
        }
      }, 1000);
    });

  passwordValidator = (control: FormControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { error: true, required: true };
    } else if (!this.regPassword.test(control.value)) {
      return { error: true, formError: true };
    }
    return {};
  };

  confirmValidator = (control: FormControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { error: true, required: true };
    } else if (control.value !== this.validateForm.controls.password.value) {
      return { error: true, confirm: true };
    }
    return {};
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private modalRef: NzModalRef,
    private userService: UserService) {
    this.validateForm = this.fb.group({
      username: [null, [Validators.required], [this.userNameAsyncValidator]],
      password: [null, [Validators.required, this.passwordValidator]],
      confirm: [null, [this.confirmValidator]]
    });
  }

  ngOnInit(): void {
  }

}
