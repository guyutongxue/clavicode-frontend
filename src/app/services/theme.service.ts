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

import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

// https://github.com/yangjunhan/nz-themes/blob/master/src/app/theme.service.ts

enum ThemeType {
  Light = "light",
  Dark = "dark"
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  constructor(
    @Inject(DOCUMENT) private document: Document
  ) {
    console.log(this);
  }

  private currentTheme: ThemeType = ThemeType.Light;

  private reverseTheme(theme: string): ThemeType {
    return theme === ThemeType.Dark ? ThemeType.Light : ThemeType.Dark;
  }

  private removeUnusedTheme(theme: ThemeType): void {
    this.document.documentElement.classList.remove(theme);
    const removedThemeStyle = this.document.getElementById(theme);
    if (removedThemeStyle) {
      this.document.head.removeChild(removedThemeStyle);
    }
  }

  private loadCss(href: string, id: string): Promise<Event> {
    return new Promise((resolve, reject) => {
      const style = this.document.createElement('link');
      style.rel = 'stylesheet';
      style.href = href;
      style.id = id;
      style.onload = resolve;
      style.onerror = reject;
      this.document.head.append(style);
    });
  }

  private loadMainTheme(): Promise<Event> {
    const theme = this.currentTheme;
    return new Promise<Event>((resolve, reject) => {
      this.loadCss(`${theme}.css`, theme).then(
        (e) => {
          this.document.documentElement.classList.add(theme);
          this.removeUnusedTheme(this.reverseTheme(theme));
          resolve(e);
        },
        (e) => reject(e)
      );
    });
  }

  private async changeMainTheme(theme: ThemeType) {
    if (theme == this.currentTheme) return;
    this.currentTheme = theme;
    return this.loadMainTheme();
  }

  private setRootCssVariable(name: string, value: string) {
    // this.rootCssVariables[name] = value;
    this.document.documentElement.style.setProperty(name, value);
  }
}
