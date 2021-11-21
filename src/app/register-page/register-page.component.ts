import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { environment } from 'src/environments/environment';
import { UserRegisterResponse } from '../api';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss']
})
export class RegisterPageComponent implements OnInit {
  validateForm: FormGroup;
  checked = true;


  submitForm(): void {
    if (this.validateForm.valid) {
      console.log('submit', this.validateForm.value);
      this.http.post<UserRegisterResponse>(`//${environment.backendHost}/user/register`, this.validateForm.value).subscribe((res) => {
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
    private http: HttpClient,
    private modalRef: NzModalRef,
    private userService: UserService) {
    this.validateForm = this.fb.group({
      email: [null, [Validators.required]],
      username: [null, [Validators.required]],
      password: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
  }

}
