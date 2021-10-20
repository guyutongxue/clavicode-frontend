import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SidebarRoutingModule } from './sidebar/sidebar-routing.module';
import { ToolsRoutingModule } from './tools/tools-routing.module';

const routes: Routes = [];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    SidebarRoutingModule,
    ToolsRoutingModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
