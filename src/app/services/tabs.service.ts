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
// import * as path from 'path';
import { EditorService } from './editor.service';

export interface Tab {
  key: string, // An unique udid for each tab
  type: "file" | "setting",
  title: string,
  code: string,
  path: string,
  // saved: boolean
}

interface TabOptions {
  key: string,
  type: "file" | "setting",
  title: string,
  code?: string,
  path?: string
}

const initTab: Tab[] = [{
  key: "aaa",
  type: "file",
  title: "a.cpp",
  code: "int main() {}",
  path: "/tmp/a.cpp",
  // saved: false
}, {
  key: "bbb",
  type: "file",
  title: "b.cpp",
  code: "#include <iostream>\nint main() { ; ; ; }",
  path: "/tmp/b.cpp",
  // saved: false
}];

@Injectable({
  providedIn: 'root'
})
export class TabsService {
  tabList: Tab[] = initTab;
  private activeTabKey: string | null = null;

  constructor(private editorService: EditorService) {
    // TabsService controls how EditorService works.
    // When EditorService is not initialized, TabsService should do noting.
    // So I add `if (!this.editorService.isInit) return;` in each function
    // that use EditorService.
    // When initialization finished, it will send a event. TabsService will
    // do necessary initialization by calling `getActive` then.
    this.editorService.editorMessage.subscribe(({ type, arg }) => {
      if (type === "initCompleted") {
        this.getActive();
      }
    });
  }

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
    if (newActive.type === "file" && this.editorService.isInit)
      this.editorService.switchToModel(newActive);
    // this.electronService.ipcRenderer.invoke('window/setTitle', newActive.path ?? newActive.title);
  }

  get hasActiveFile() {
    const [activeTab] = this.getActive();
    return activeTab !== null && activeTab.type === "file";
  }

  add(options: TabOptions) {
    const newTab: Tab = {
      key: options.key,
      type: options.type,
      title: options.title,
      code: options.code ?? "",
      // saved: true, // !(options.type === "file" && typeof options.path === "undefined") // use this if create unsaved new file
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
    if (target.type === "file")
      this.editorService.destroy(target);
    return newIndex;
  }

  // saveCode(key: string, savePath: string): void {
  //   if (!this.editorService.isInit) return;
  //   const target = this.getByKey(key).value;
  //   const oldPath = target.path;
  //   target.saved = true;
  //   target.path = savePath;
  //   target.title = path.basename(savePath);
  //   this.editorService.switchToModel(target, savePath !== oldPath);
  // }
}
