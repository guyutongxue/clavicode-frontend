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
import { Routes, RouterModule } from '@angular/router';

// import { OutlineComponent } from './outline/outline.component';
// import { WatchComponent } from './watch/watch.component';
import { EmptyPageComponent } from '../empty-page/empty-page.component';
import { SidebarSearchComponent } from './sidebar-search/sidebar-search.component';
import { SidebarFileComponent } from './sidebar-file/sidebar-file.component';
import { SidebarCommonComponent } from './sidebar-common/sidebar-common.component';
import { SidebarDebugComponent } from './sidebar-debug/sidebar-debug.component';
import { SidebarProblemComponent } from './sidebar-problem/sidebar-problem.component';
import { SidebarSettingsComponent } from './sidebar-settings/sidebar-settings.component';
import { SidebarUserComponent } from './sidebar-user/sidebar-user.component';
const routes: Routes = [
  {
    path: 'common',
    component: SidebarCommonComponent,
    outlet: 'sidebar'
  },
  {
    path: 'debug',
    component: SidebarDebugComponent,
    outlet: 'sidebar'
  },
  {
    path: 'problem',
    component: SidebarProblemComponent,
    outlet: 'sidebar'
  },
  {
    path: 'search',
    component: SidebarSearchComponent,
    outlet: 'sidebar'
  },
  {
    path: 'settings',
    component: SidebarSettingsComponent,
    outlet: 'sidebar'
  },
  {
    path: 'user',
    component: SidebarUserComponent,
    outlet: 'sidebar'
  }
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SidebarRoutingModule {}
