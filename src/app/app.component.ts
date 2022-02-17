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

import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TabsService } from './services/tabs.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  private windowHeight: number;

  constructor(
    private route: ActivatedRoute,
    private tabsService: TabsService,
    private themeService: ThemeService) {
    this.windowHeight = window.innerHeight;
    const themeName = window.localStorage.getItem("theme") ?? "classic";
    this.themeService.setTheme(themeName);
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const lang: string | undefined = params['lang'];
      const code: string | undefined = params['code'];
      if (typeof lang === 'string') {
        this.tabsService.changePinned(lang, code);
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.windowHeight = window.innerHeight;
  }

  get headerHeight() {
    return 32;
  }

  get footerHeight() {
    return 20;
  }

  get mainViewHeight() {
    return this.windowHeight - this.headerHeight - this.footerHeight;
  }

}
