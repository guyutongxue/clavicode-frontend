import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserSystemResponse } from 'src/app/api';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-sidebar-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})

export class FeedbackComponent implements OnInit {
  
  feedbackForm: FormGroup;
  msg = "";
  isLoading = false;
  onSubmit():void{
    if (this.feedbackForm.valid){
      console.log(this.feedbackForm.value)
      this.isLoading = true;
      this.http.post<UserSystemResponse>(`//${environment.backendHost}/user/feedback`,
      this.feedbackForm.value).subscribe((res) => {
        this.isLoading = false;
        if (res.success){
          this.msg = '谢谢你的反馈, 管理员xgg会尽快解决~';
        }
        else {
          this.msg = '反馈失败';
        }
        setTimeout(() => { this.msg = ""}, 20 * 1000);
      })
    }else {
      Object.values(this.feedbackForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  } 

  constructor(private fb: FormBuilder,
    private http: HttpClient) {
    this.feedbackForm = this.fb.group({
      feedback: [null, [Validators.maxLength(100)]]
    })
  }

  ngOnInit(): void {
  }

}
