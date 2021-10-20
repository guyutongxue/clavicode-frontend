
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

// import { ProblemsComponent } from './problems/problems.component'
// import { OutputComponent } from './output/output.component';
// import { DebugComponent } from './debug/debug.component';
import { EmptyPageComponent } from '../empty-page/empty-page.component';

const routes: Routes = [
  {
    path: 'problems',
    component: EmptyPageComponent,
    outlet: 'tools'
  },
  {
    path: 'output',
    component: EmptyPageComponent,
    outlet: 'tools'
  },
  {
    path: 'debug',
    component: EmptyPageComponent,
    outlet: 'tools'
  }
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ToolsRoutingModule {}
