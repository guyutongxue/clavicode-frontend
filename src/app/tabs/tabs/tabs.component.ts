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
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { Tab, TabsService } from '../../services/tabs.service';
import { FileLocalService } from 'src/app/services/file-local.service';
import { FileService } from 'src/app/services/file.service';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit {

  constructor(
    private router: Router, 
    private tabsService: TabsService,
    private fileService: FileService,
    public flService: FileLocalService,
    public nzContextMenuService: NzContextMenuService
    ) { }

  ngOnInit(): void {
  }

  get tabList() {
    return this.tabsService.tabList;
  }

  get activeIndex(): number {
    return this.tabsService.getActive()[1];
  }
  set activeIndex(index: number) {
    if (index >= 0) {
      this.tabsService.changeActive(index);
    }
  }

  private doRemoveTab(tab: Tab) {
    this.activeIndex = this.tabsService.remove(tab.key);
  }

  closeTab(e: { index: number }) {
    const target = this.tabList[e.index];
    if (target.saved === false) {
      this.notSaveModalShow(target);
    } else {
      this.doRemoveTab(target);
    }
  }

  // https://github.com/NG-ZORRO/ng-zorro-antd/issues/3461
  cdkOnDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.tabsService.tabList, event.previousIndex, event.currentIndex);
    // this.activeIndex = event.currentIndex;
  }


  notSaveModalTab: Tab | null = null;
  async notSaveModalYes() {
    if (!this.notSaveModalTab) return;
    if (this.notSaveModalTab.type === "local" && await this.flService.save(this.notSaveModalTab))
      this.doRemoveTab(this.notSaveModalTab);
    this.notSaveModalTab = null;
  }
  notSaveModalNo() {
    if (!this.notSaveModalTab) return;
    this.doRemoveTab(this.notSaveModalTab);
    this.notSaveModalTab = null;
  }
  notSaveModalCancel() {
    this.notSaveModalTab = null;
  }

  private notSaveModalShow(target: Tab) {
    this.notSaveModalTab = target;
  }
  
  languages = [
    {
      id: 'cpp',
      title: 'C++'
    },
    {
      id: 'python',
      title: 'Python'
    }
  ];

  get currentLang() {
    return this.tabsService.pinnedLang;
  }

  set currentLang(value: string) {
    this.tabsService.changePinned(value);
  }

  @HostListener('window:beforeunload')
  canDeactivate(): boolean {
    return this.tabList.every(tab => tab.type !== "local" || tab.saved);
  }
}
