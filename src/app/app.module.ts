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
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { zh_CN } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { AngularSplitModule } from 'angular-split';
import { DialogModule } from '@ngneat/dialog'
import { TabsModule } from './tabs/tabs.module';
import { ToolsModule } from './tools/tools.module';

import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { MainViewComponent } from './main-view/main-view.component';
import { EmptyPageComponent } from './empty-page/empty-page.component';
import { XtermComponent } from './execute-dialog/xterm/xterm.component';
import { ExecuteDialogComponent } from './execute-dialog/execute-dialog.component';
import { SidebarSearchComponent } from './sidebar-search/sidebar-search.component';
import { SidebarFileComponent } from './sidebar-file/sidebar-file.component';
import { SidebarCommonComponent } from './sidebar-common/sidebar-common.component';
import { SidebarDebugComponent } from './sidebar-debug/sidebar-debug.component';
import { SidebarProblemComponent } from './sidebar-problem/sidebar-problem.component';
import { ProblemsComponent } from './problems/problems.component';
import { OutputComponent } from './output/output.component';
import { DebugComponent } from './debug/debug.component';
registerLocaleData(zh);

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    MainViewComponent,
    EmptyPageComponent,
    XtermComponent,
    ExecuteDialogComponent,
    SidebarSearchComponent,
    SidebarFileComponent,
    SidebarCommonComponent,
    SidebarDebugComponent,
    SidebarProblemComponent,
    ProblemsComponent,
    OutputComponent,
    DebugComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularSplitModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MonacoEditorModule,
    NzIconModule,
    DialogModule.forRoot(),
    TabsModule,
    ToolsModule,
    NzButtonModule,
    NzInputModule,
    NzUploadModule,
    NzCollapseModule,
    NzListModule,
    NzSkeletonModule,
    NzTabsModule
  ],
  providers: [{ provide: NZ_I18N, useValue: zh_CN }],
  bootstrap: [AppComponent]
})
export class AppModule { }
