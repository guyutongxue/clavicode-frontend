import { Component, OnInit } from '@angular/core';
import * as path from 'path';
import { Observable } from 'rxjs';
import { ProblemsService, GccDiagnostic, GccDiagnosticPosition } from 'src/app/services/problems.service';
import { FileService } from 'src/app/services/file.service';
import { map } from 'rxjs/operators';

export interface ITreeNode extends GccDiagnostic {
  level: number;
  expand: boolean;
  parent?: ITreeNode;
}

@Component({
  selector: 'app-problems',
  templateUrl: './problems.component.html',
  styleUrls: ['./problems.component.scss']
})
export class ProblemsComponent implements OnInit {

  readonly iconMap: { [key: string]: { type: string, color: string } } = {
    error: {
      type: 'close-circle',
      color: 'red'
    },
    warning: {
      type: 'warning',
      color: 'orange'
    },
    note: {
      type: 'info-circle',
      color: 'blue'
    }
  };

  printPosition(position: GccDiagnosticPosition): string {
    // TODO: tmp file path should sent from backend
    if (position.file.startsWith('tmp')) position.file = '/tmp/main.cpp';
    return `${path.basename(position.file)}:${position.line}:${position.column}`;
  }

  flattenData$: Observable<ITreeNode[]>;

  constructor(
    private fileService: FileService,
    private problemsService: ProblemsService) { 
      this.flattenData$ = this.problemsService.problems.pipe(
        map(rawData => {
          const flatten: ITreeNode[] = [];
          rawData.forEach(item => {
            flatten.splice(-1, 0, ...this.flattener(item));
          });
          console.log(flatten);
          return flatten;
        })
      );}

  ngOnInit(): void {
  }

  get tableHeight(): number {
    return this.problemsService.panelHeight - this.tableHeaderHeight;
  }

  // Ant-design: font-size * line-height + 2 * padding
  private readonly tableHeaderHeight: number = 14 * 1.5715 + 2 * 8;

  private flattener(root: GccDiagnostic): ITreeNode[] {
    const stack: ITreeNode[] = [];
    const array: ITreeNode[] = [];
    stack.push({ ...root, level: 0, expand: false });
    while (stack.length !== 0) {
      const node = stack.pop()!;
      node.message = node.message;
      array.push(node);
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push({ ...node.children[i], level: node.level + 1, expand: false, parent: node });
        }
      }
    }
    return array;
  }

  showProblem(item: ITreeNode): void {
    const mainLocation = item.locations[0].caret;
    if (mainLocation.file.startsWith('tmp')) mainLocation.file = '/tmp/main.cpp';
    this.fileService.locate(mainLocation.file, mainLocation.line, mainLocation.column);
  }

}
