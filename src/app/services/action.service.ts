import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CompileService } from './compile.service';
import { ExecuteService } from './execute.service';
import { OjService } from './oj.service';
import { UserService } from './user.service';

type Action = {
  name: string;
  icon?: string;
  shortcut?: string;
  enabled: () => boolean;
  run: () => void;
};

type GlobalStatus = 'ready' | 'executing' | 'compiling' | 'debugging';

@Injectable({
  providedIn: 'root'
})
export class ActionService {

  constructor(
    private compileService: CompileService,
    private executeService: ExecuteService,
    private ojService: OjService,
    private userService: UserService) { }

  readonly actions: Record<string, Action> = {
    'compile.interactive': {
      name: '编译运行',
      icon: 'play-circle',
      shortcut: 'control.b',
      enabled: () => true,
      run: async () => {
        const token = await this.compileService.interactiveCompile();
        if (token === null) return;
        this.executeService.create(token);
      }
    },
    'oj.submit': {
      name: '提交',
      icon: 'cloud-upload',
      shortcut: 'f7',
      enabled: () => this.ojService.hasProblem(),
      run: () => this.ojService.submit()
    },
    'user.login': {
      name: '登录',
      icon: 'user',
      enabled: () => !this.userService.isLoggedIn,
      run: () => this.userService.login()
    },
    'user.register': {
      name: '注册',
      icon: 'user-add',
      enabled: () => true,
      run: () => this.userService.register()
    },
    'user.logout': {
      name: '注销',
      enabled: () => !!this.userService.isLoggedIn,
      run: () => this.userService.logout()
    }
  }

  runAction(id: string): void {
    const action = this.actions[id];
    if (action?.enabled()) action.run();
  }

  status = new BehaviorSubject<GlobalStatus>('ready');

}
