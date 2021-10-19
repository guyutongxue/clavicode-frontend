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

import { Component, OnInit } from '@angular/core';
import { ExecuteService } from '../services/execute.service';
import { NzIconService } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.scss']
})
export class MainViewComponent implements OnInit {

  readonly sidebarItems = [
      {
        title: '常用',
        url: 'common',
        icon: 'star',
        disabled: false
      },
      {
        title: '调试',
        url: 'debug',
        icon: 'control',
        disabled: false
      },
      {
        title: '文件',
        url: 'file',
        icon: 'file',
        disabled: true
      }
    ];

  constructor(private iconService: NzIconService, private executeService: ExecuteService) {
    // this.iconService.fetchFromIconfont({
    //   scriptUrl: 'https://at.alicdn.com/t/font_2879102_dgzdvy8za0i.js'
    // })
  }

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
