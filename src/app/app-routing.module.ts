import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SidebarRoutingModule } from './sidebar/sidebar-routing.module';
import { EditorComponent } from './tabs/editor/editor.component';
import { ToolsRoutingModule } from './tools/tools-routing.module';

const routes: Routes = [
  // {
  //   path: 'setting/~build',
  //   component: BuildSettingComponent,
  //   children: [
  //     {
  //       path: '',
  //       canActivate: [SettingsGuard],
  //       component: EmptyPageComponent
  //     },
  //     {
  //       path: 'sfb',
  //       component: SfbSettingComponent
  //     },
  //     {
  //       path: 'env',
  //       component: EnvSettingComponent
  //     }
  //   ]
  // },
  // {
  //   path: 'setting/~editor',
  //   component: EditorSettingComponent,
  //   children: [
  //     {
  //       path: '',
  //       canActivate: [SettingsGuard],
  //       component: EmptyPageComponent
  //     },
  //     {
  //       path: 'theme',
  //       component: ThemeSettingComponent
  //     }
  //   ]
  // },
  {
    path: '',
    component: EditorComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    SidebarRoutingModule,
    ToolsRoutingModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
