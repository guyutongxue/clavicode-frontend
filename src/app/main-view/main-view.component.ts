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
import { Router } from '@angular/router';

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
        disabled: false
      },
      {
        title: '运行',
        url: 'play',
        icon: 'play-circle',
        disabled: false

      },
      {
        title: '搜索',
        url: 'search',
        icon: 'search',
        disabled: false

      }
    ];
  readonly toolsItems = [
    {
      title: '问题',
      url: 'problems',
      disabled: false
    }
  ]

  constructor(private router: Router, private executeService: ExecuteService) {
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

  currentOutletUrl(name: string) {
    const routerChildren = this.router.parseUrl(this.router.url).root.children;
    if (name in routerChildren) {
      return routerChildren[name].segments[0].path;
    }
    return null;
  }
  showSidebar(who: string): void {
    if (who === this.currentOutletUrl("sidebar") || who === null) {
      this.router.navigate([{
        outlets: {
          sidebar: null
        }
      }]);
    } else {
      if (this.sidebarItems.find(i => i.url === who)?.disabled) return;
      this.router.navigate([{
        outlets: {
          sidebar: who
        }
      }]);
    }
  }
  showTools(who: string): void {
    if (who === this.currentOutletUrl("tools") || who === null) {
      this.router.navigate([{
        outlets: {
          tools: null
        }
      }]);
    } else {
      if (this.toolsItems.find(i => i.url === who)?.disabled) return;
      this.router.navigate([{
        outlets: {
          tools: who
        }
      }]);
    }
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
