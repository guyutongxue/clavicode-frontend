import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserGetVeriCodeResponse, UserSystemResponse } from "../../api";
import { environment } from 'src/environments/environment';
import { BooleanInput } from 'ng-zorro-antd/core/types';


@Component({
  selector: 'app-sidebar-user',
  templateUrl: './sidebar-user.component.html',
  styleUrls: ['./sidebar-user.component.scss']
})
export class SidebarUserComponent implements OnInit {

  validateForm: FormGroup;
  changePasswordForm: FormGroup;
  inInterval = false;
  verifyBtnTxt: String;
  isLoading = false;
  regPassword = /^(?=.*?[a-z])(?=.*?[0-9]).{6,}$/;

  submitForm(): void {
    console.log("here");
    if (this.validateForm.valid) {
      console.log('submit', this.validateForm.value);
      this.isLoading = true;
      this.http.post<UserGetVeriCodeResponse>(`//${environment.backendHost}/user/getVeriCode`, this.validateForm.value, { withCredentials: true }).subscribe((res) => {
        this.isLoading = false;
        if (res.success) {
          let i = 60;
          this.inInterval = true;
          const repeat = () => {
            if (--i < 0) {
              this.inInterval = false;
              this.verifyBtnTxt = "验证";
              return;
            }
            setTimeout(() => {
              this.verifyBtnTxt = `验证邮件已发送, 请于${i}秒后重试`;
              repeat();
            }, 1000);
            return;
          };
          repeat();
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

  isChangingPassword = false;
  changePasswordBtn = "修改密码";
  changePasswordMsg = "";

  submitForm_changePassword(): void {
    console.log("here");
    if (this.changePasswordForm.valid) {
      console.log('submit', this.changePasswordForm.value);
      this.isChangingPassword = true;
      this.http.post<UserSystemResponse>(`//${environment.backendHost}/user/changePassword`, 
      {oldPassword: this.changePasswordForm.value.oldPassword, newPassword: this.changePasswordForm.value.newPassword}, {withCredentials: true }).subscribe((res) => {
        this.isChangingPassword = false;
        console.log(res)
        if (res.success) {
          this.changePasswordMsg = "密码修改成功!";
        } else {
          this.changePasswordMsg = "密码修改失败:" + res.reason;
        }
        setTimeout(()=>{
          this.changePasswordMsg = ""; 
        }, 10000);
      });
    } else {
      Object.values(this.changePasswordForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  refresh(): void {
    this.userService.updateUserInfo();
    return;
  }
  ngOnInit(): void { }


  get userInfo() {
    return this.userService.userInfo.value;
  }

  passwordValidator = (control: FormControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { error: true, required: true };
    } else if (!this.regPassword.test(control.value)) {
      return { error: true, formError: true };
    }
    return {};
  }
  
  confirmValidator = (control: FormControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { error: true, required: true };
    } else if (control.value !== this.changePasswordForm.controls.newPassword.value) {
      return { error: true, confirm: true };
    }
    return {};
  }

  constructor(private userService: UserService,
    private fb: FormBuilder,
    private http: HttpClient) {
    this.verifyBtnTxt = "验证";
    this.validateForm = this.fb.group({
      email: [null, [Validators.required]]
    });
    this.changePasswordForm = this.fb.group({
      oldPassword: ["", [Validators.required]],
      newPassword: ["", [Validators.required, this.passwordValidator]],
      confirm: [null, [this.confirmValidator]]
    });
  }
}
