import { Injectable } from '@angular/core';
import { CompileService } from './compile.service';
import { ExecuteService } from './execute.service';
import { OjService } from './oj.service';

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
    private compileService: CompileService,
    private executeService: ExecuteService,
    private ojService: OjService) { }

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
    }
  }

}
