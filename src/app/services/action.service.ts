import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { BehaviorSubject, Observable } from 'rxjs';
import { CompileService } from './compile.service';
import { EditorService } from './editor.service';
import { ExecuteService } from './execute.service';
import { FileLocalService } from './file-local.service';
import { OjService } from './oj.service';
import { PyodideService } from './pyodide.service';
import { StatusService } from './status.service';
import { TabsService } from './tabs.service';
import { UserService } from './user.service';

type Action = {
  name: string;
  icon?: string;
  shortcut?: string;
  enabled: () => boolean;
  run: () => void;
};

@Injectable({
  providedIn: 'root'
})
export class ActionService {

  constructor(
    private eventManager: EventManager,
    @Inject(DOCUMENT) private document: Document,
    private compileService: CompileService,
    private executeService: ExecuteService,
    private pyodideService: PyodideService,
    private tabsService: TabsService,
    private flService: FileLocalService,
    private editorService: EditorService,
    private ojService: OjService,
    private userService: UserService,
    private statusService: StatusService) {
      for (const i in this.actions) {
        const action = this.actions[i];
        if (action.shortcut) {
          this.addShortcut(action.shortcut).subscribe(() => {
            if (action.enabled()) action.run();
          });
        }
      }
    }

  readonly actions: Record<string, Action> = {
    'compile.interactive': {
      name: '编译运行',
      icon: 'play-circle',
      shortcut: 'control.b',
      enabled: () => this.statusService.value === 'ready',
      run: async () => {
        const lang = this.editorService.getLanguage();
        switch (lang) {
          case "cpp": {
            const token = await this.compileService.interactiveCompile();
            if (token === null) return;
            this.executeService.create(token);
            break;
          }
          case "python": {
            this.pyodideService.runCode(this.editorService.getCode());
            break;
          }
          default:
            break;
        }

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
    },
    'file.save': {
      name: '保存',
      icon: 'save',
      shortcut: 'control.s',
      enabled: () => this.tabsService.getActive()[0]?.type === 'local',
      run: () => this.flService.save(this.tabsService.getActive()[0])
    }
  }

  runAction(id: string): void {
    const action = this.actions[id];
    if (action?.enabled()) action.run();
  }

  private addShortcut(key: string) {
    const event = `keydown.${key}`;
    return new Observable<KeyboardEvent>((observer) => {
      const handler = (e: KeyboardEvent) => {
        e.preventDefault();
        observer.next(e);
      };
      const dispose = this.eventManager.addEventListener(
        this.document.body, event, handler
      );
      return () => dispose();
    });
  }

}
