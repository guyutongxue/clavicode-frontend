import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserGetVeriCodeResponse } from "../../api";
import { environment } from 'src/environments/environment';
import { BooleanInput } from 'ng-zorro-antd/core/types';


@Component({
  selector: 'app-sidebar-user',
  templateUrl: './sidebar-user.component.html',
  styleUrls: ['./sidebar-user.component.scss']
})
export class SidebarUserComponent implements OnInit {

  validateForm: FormGroup;
  inInterval = false;
  verifyBtnTxt: String;
  isLoading = false;

  submitForm(): void {
    console.log("here");
    if (this.validateForm.valid) {
      console.log('submit', this.validateForm.value);
      this.isLoading = true;
      this.http.post<UserGetVeriCodeResponse>(`//${environment.backendHost}/user/getVeriCode`, this.validateForm.value, { withCredentials: true }).subscribe((res) => {
        this.isLoading = false;
        if (res.success) {
          let i = 10;
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

  refresh(): void {
    this.userService.updateUserInfo();
    return;
  }
  ngOnInit(): void { }


  get userInfo() {
    return this.userService.userInfo.value;
  }
  constructor(private userService: UserService,
    private fb: FormBuilder,
    private http: HttpClient) {
    this.verifyBtnTxt = "验证";
    this.validateForm = this.fb.group({
      email: [null, [Validators.required]]
    });
  }
}
