import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NzCascaderOption } from 'ng-zorro-antd/cascader';
import { OjGetProblemResponse, OjListProblemSetsResponse, OjListProblemsResponse } from 'src/app/api';
import { ProblemsComponent } from '../../tools/problems/problems.component';
import { environment } from '../../../environments/environment';
import { OjService } from 'src/app/services/oj.service';


const LIST_PROBLEM_SET_URL = `//${environment.backendHost}/oj/listProblemSets`;
const LIST_PROBLEM_URL = `//${environment.backendHost}/oj/listProblems/`;
@Component({
  selector: 'app-sidebar-problem',
  templateUrl: './sidebar-problem.component.html',
  styleUrls: ['./sidebar-problem.component.scss']
})
export class SidebarProblemComponent implements OnInit {
  
  get problemId() {
    return this.ojService.problemId;
  }

  get description() {
    return this.ojService.problemDescription;
  }

  constructor(private ojService: OjService) { }

  ngOnInit() {
  }

  // Must use arrow function to keep this context
  loadProblem = async (node: NzCascaderOption, index: number) => {
    console.log(node, index);
    if (index === -1) {
      // load set list
      const res = await this.ojService.listProblemSets();
      if (!res) return;
      node.children = res.map<NzCascaderOption>(set => ({
        value: set.problemSetId,
        label: set.title,
        disabled: set.status !== 'ok',
        isLeaf: false
      }));
    } else if (index === 0) {
      // load problem list
      const res = await this.ojService.listProblems(node.value);
      if (!res) return;
      node.children = res.map<NzCascaderOption>(problem => ({
        value: problem.problemId,
        status: problem.status,
        label: problem.title,
        parent: node,
        isLeaf: true
      }));
    }
  }

  async updateDescription(value: string[]) {
    this.ojService.updateDescription(value);
  }

}
