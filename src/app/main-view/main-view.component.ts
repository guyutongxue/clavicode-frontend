import { Component, OnInit } from '@angular/core';
import { ExecuteService } from '../services/execute.service';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.scss']
})
export class MainViewComponent implements OnInit {

  constructor(private executeService: ExecuteService) { }

 
  ngOnInit(): void {
    this.executeService.create();
    this.executeService.receiver?.subscribe(msg => {
      console.log(msg);
    })
  }

  send() {
    this.executeService.sender?.next({
      message: 'Hello from app component'
    });
  }

  close() {
    this.executeService.close();
  }


}
