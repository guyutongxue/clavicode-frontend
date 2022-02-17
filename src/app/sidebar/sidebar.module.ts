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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarSearchComponent } from './sidebar-search/sidebar-search.component';
import { SidebarFileComponent } from './sidebar-file/sidebar-file.component';
import { SidebarCommonComponent } from './sidebar-common/sidebar-common.component';
import { SidebarDebugComponent } from './sidebar-debug/sidebar-debug.component';
import { SidebarProblemComponent } from './sidebar-problem/sidebar-problem.component';
import { SidebarSettingsComponent } from './sidebar-settings/sidebar-settings.component';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCascaderModule } from 'ng-zorro-antd/cascader';
import { NzTreeViewModule } from 'ng-zorro-antd/tree-view';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { SidebarUserComponent } from './sidebar-user/sidebar-user.component';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { FeedbackComponent } from './feedback/feedback.component';


@NgModule({
  declarations: [
    SidebarSearchComponent,
    SidebarFileComponent,
    SidebarCommonComponent,
    SidebarDebugComponent,
    SidebarProblemComponent,
    SidebarSettingsComponent,
    SidebarUserComponent,
    FeedbackComponent
  ],
  imports: [
    NzModalModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzUploadModule,
    NzCollapseModule,
    NzListModule,
    NzTabsModule,
    NzFormModule,
    NzSkeletonModule,
    NzCheckboxModule,
    NzIconModule,
    NzCascaderModule,
    NzTreeViewModule,
    NzDropDownModule,
    NzRadioModule,
    NzDividerModule
  ]
})
export class SidebarModule { }
