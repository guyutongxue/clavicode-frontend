import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Observable, Observer } from 'rxjs';
import { UserRegisterResponse, UserSystemResponse } from '../api';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.scss']
})
export class ForgetPasswordComponent implements OnInit {
  emailForm: FormGroup;
  hintMsg = ""
  isLoading = false;
  onSubmit(): void {
    if (this.emailForm.valid) {
      console.log('submit email', this.emailForm.value);
      this.isLoading = true;
      this.http.post<UserRegisterResponse>(`//${environment.backendHost}/user/forgotPassword`,
        { email: this.emailForm.value.email}).subscribe((res) => {
          this.isLoading = false;
          if (res.success) {
            this.modalRef.close();
            alert("确认邮件已发送至邮箱");
          } else {
            alert("error: " + res.reason);
          }
        });
    } else {
      Object.values(this.emailForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  ngOnInit(): void {
  } 

  emailAsyncValidator = (control: FormControl) =>
    new Observable((observer: Observer<ValidationErrors | null>)=>{
      setTimeout(()=>{
        if (!control.value){
          observer.next({error:true, required: true}); 
          observer.complete();
        }
        else {
          this.http.get<UserSystemResponse>(`//${environment.backendHost}/user/search`, {params: {email: control.value, username:""}}).subscribe(
            (res) => {
              console.log(res)
              if(res.success) {
                observer.next(null);
              } else{
                observer.next({error: true, unfound: true});
              }
              observer.complete();
            }
          );
        }
      }, 1000);
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpClient, 
    private modalRef: NzModalRef
  ) { 
    this.emailForm = this.fb.group({
      email: [null, [Validators.required], [this.emailAsyncValidator]] 
    })
  }
}
