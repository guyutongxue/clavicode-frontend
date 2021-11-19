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
import { FormsModule } from '@angular/forms';
import { SidebarSearchComponent } from './sidebar-search/sidebar-search.component';
import { SidebarFileComponent } from './sidebar-file/sidebar-file.component';
import { SidebarCommonComponent } from './sidebar-common/sidebar-common.component';
import { SidebarDebugComponent } from './sidebar-debug/sidebar-debug.component';
import { SidebarProblemComponent } from './sidebar-problem/sidebar-problem.component';
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
import { NzCascaderModule } from 'ng-zorro-antd/cascader';


@NgModule({
  declarations: [
    SidebarSearchComponent,
    SidebarFileComponent,
    SidebarCommonComponent,
    SidebarDebugComponent,
    SidebarProblemComponent
  ],
  imports: [
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
    NzCascaderModule
  ]
})
export class SidebarModule { }
