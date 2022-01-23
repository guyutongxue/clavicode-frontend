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
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { EditorService } from './editor.service';

// https://github.com/yangjunhan/nz-themes/blob/master/src/app/theme.service.ts

enum ThemeType {
  Light = "light",
  Dark = "dark"
}

type ThemeData = {
  type: string;
  name: string;
  colors: Partial<{
    background: string;
    foreground: string;
    activeLine: string;
    debugStep: string;
    breakpoint: string;
    preprocessor: string;
    string: string;
    "string.char": string;
    keyword: string;
    punctuation: string;
    number: string;
    comment: string;
    macro: string;
    type: string;
    variable: string;
    "variable.param": string;
    function: string;
  }>;
  boldTokens: string[];
  italicTokens: string[];
  underlineTokens: string[];
};

const DETAULT_THEME = {
  "type": "light",
  "name": "Dev-C++ Classic+",
  "colors": {
    "background": "#ffffff",
    "foreground": "#000000",
    "activeLine": "#ccffff",
    "debugStep": "#add8e6",
    "breakpoint": "#f08080",
    "preprocessor": "#008000",
    "string": "#0000ff",
    "string.char": "#000000",
    "keyword": "#000000",
    "punctuation": "#ff0000",
    "number": "#800080",
    "comment": "#0078d7",
    "macro": "#008000",
    "type": "#267f99",
    "variable": "#001080",
    "function": "#795e26"
  },
  "boldTokens": [
    "keyword",
    "string",
    "punctuation"
  ],
  "italicTokens": [
    "comment"
  ],
  "underlineTokens": []
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private http: HttpClient,
    private editorService: EditorService
  ) {
  }

  private currentTheme: ThemeType = undefined!;

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
    if (theme === this.currentTheme) return;
    this.currentTheme = theme;
    return this.loadMainTheme();
  }

  private setRootCssVariable(name: string, value: string) {
    // this.rootCssVariables[name] = value;
    this.document.documentElement.style.setProperty(name, value);
  }

  async setTheme(name: string): Promise<void> {
    const theme = await this.http.get<ThemeData>(`/assets/themes/${name}.json`).toPromise();
    this.changeMainTheme(theme.type as ThemeType);
    this.setRootCssVariable("--breakpoint-background-color", theme.colors.breakpoint ?? DETAULT_THEME.colors.breakpoint);
    this.setRootCssVariable("--debug-step-background-color", theme.colors.debugStep ?? DETAULT_THEME.colors.debugStep);
    const nonTokenColors = [
      "background", "foreground", "activeLine", "debugStep", "breakpoint"
    ];
    const rules = Object.entries(theme.colors)
      .filter(([key, _]) => !nonTokenColors.includes(key))
      .map(([key, value]) => {
        const styles: string[] = [];
        if (theme.boldTokens.includes(key)) styles.push("bold");
        if (theme.italicTokens.includes(key)) styles.push("italic");
        if (theme.underlineTokens.includes(key)) styles.push("underline");
        return <monaco.editor.ITokenThemeRule>{
          token: key,
          foreground: value,
          fontStyle: styles.join(" ")
        };
      });
    const editorTheme: monaco.editor.IStandaloneThemeData = {
      base: theme.type === 'light' ? 'vs': 'vs-dark',
      inherit: true,
      colors: {
        'editor.background': theme.colors.background ?? DETAULT_THEME.colors.background,
        'editor.lineHighlightBackground': theme.colors.activeLine ?? DETAULT_THEME.colors.activeLine,
      },
      rules: [
        {
          token: '',
          foreground: theme.colors.foreground,
        },
        ...rules
      ]
    };
    this.editorService.setEditorTheme(editorTheme);
  }
}
