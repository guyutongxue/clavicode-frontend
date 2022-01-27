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

import { Injectable } from '@angular/core';
import { basename } from 'path';

import { EditorService } from './editor.service';

export interface Tab {
  key: string; // An unique udid for each tab
  type: "pinned" | "local" | "remote",
  title: string;
  code: string;
  path: string;
  saved: boolean;
}

interface TabOptions {
  key: string,
  type: "local" | "remote",
  title: string,
  code: string,
  path: string
}

const INIT_TABS: Record<string, {
  ext: string;
  code: string;
}> = {
  'cpp': {
    ext: "cpp",
    code: `#include <iostream>
int main() {
    std::cout << "Hello, world!" << std::endl;
}`,
  },
  'python': {
    ext: "py",
    code: `# A + B problems in Python
a = int(input("请输入 a："))
b = int(input("请输入 b："))
print("结果是：", end='')
print(a + b)`
  }
};

@Injectable({
  providedIn: 'root'
})
export class TabsService {
  tabList: Tab[];
  private activeTabKey: string | null = 'main';

  constructor(private editorService: EditorService) {
    const init = INIT_TABS[this.pinnedLang];
    this.tabList = [{
      key: 'main',
      title: `main.${init.ext}`,
      path: `/tmp/main.${init.ext}`,
      type: 'pinned',
      code: init.code,
      saved: true
    }];
  }

  /** Sync tab.code from current editor. */
  syncActiveCode() {
    if (!this.editorService.isInit) return;
    const [activeTab] = this.getActive();
    if (activeTab === null) return;
    activeTab.code = this.editorService.getCode();
  }

  getActive(): [Tab | null, number] {
    if (this.activeTabKey === null) return [null, -1];
    return this.getByKey(this.activeTabKey);
  }

  getByKey(key: string): [Tab | null, number] {
    const index = this.tabList.findIndex((x: Tab) => x.key === key);
    if (index === -1) return [null, -1];
    return [
      this.tabList[index],
      index
    ];
  }

  changeActive(key?: string): void;
  changeActive(index: number): void;
  changeActive(arg?: string | number): void {
    if (typeof arg === "undefined") {
      if (this.editorService.isInit) this.editorService.switchToModel(this.getActive()[0]!);
      return;
    }
    if (this.activeTabKey !== null) {
      this.syncActiveCode();
    }
    if (typeof arg === "string") {
      this.activeTabKey = arg;
    }
    else if (typeof arg === "number") {
      this.activeTabKey = this.tabList[arg].key;
    }
    const [newActive] = this.getActive();
    if (newActive === null) return;
    if (this.editorService.isInit)
      this.editorService.switchToModel(newActive);
    // this.electronService.ipcRenderer.invoke('window/setTitle', newActive.path ?? newActive.title);
  }

  get hasActiveFile() {
    const [activeTab] = this.getActive();
    return activeTab !== null;
  }

  add(options: TabOptions) {
    const newTab: Tab = {
      key: options.key,
      type: options.type,
      title: options.title,
      code: options.code ?? "",
      saved: true,
      path: options.path ?? `/tmp/${options.title}`
    };
    this.tabList.push(newTab);
  }

  /** @return new active index */
  remove(key: string): number {
    // Clone it, for we will remove it's src later
    const [_, index] = this.getByKey(key);
    let newIndex = -1;
    const target: Tab = { ...this.tabList[index] };
    this.tabList.splice(index, 1);
    // closing current tab
    if (this.activeTabKey === key) {
      this.activeTabKey = null;
      if (this.tabList.length === 0) {
        // The only tab in MainView
        // this.electronService.ipcRenderer.invoke('window/setTitle', '');
      } else if (index === this.tabList.length) {
        // The last tab, move to front
        newIndex = index - 1;
      } else {
        // Stay on current index (next tab)
        newIndex = index;
      }
    }
    this.editorService.destroy(target);
    return newIndex;
  }

  saveCode(key: string): void {
    if (!this.editorService.isInit) return;
    const [target] = this.getByKey(key);
    if (target === null) return;
    // const oldPath = target.path;
    // target.saved = true;
    // target.path = savePath;
    // target.title = basename(savePath);
    this.editorService.switchToModel(target);
  }

  pinnedLang: string = 'python';
  changePinned(lang: string, code?: string) {
    const [_, i] = this.getByKey('main');
    const tab = INIT_TABS[lang];
    this.tabList[i] = {
      key: 'main',
      title: `main.${tab.ext}`,
      path: `/tmp/main.${tab.ext}`,
      type: 'pinned',
      code: code ?? tab.code,
      saved: true
    };
    this.activeTabKey = null; // prevent sync editor code to tab
    this.changeActive('main');
    this.pinnedLang = lang;
  }
}
