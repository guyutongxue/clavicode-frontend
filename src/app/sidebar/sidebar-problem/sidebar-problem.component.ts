import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NzCascaderOption } from 'ng-zorro-antd/cascader';
import { OjGetProblemResponse, OjListProblemSetsResponse, OjListProblemsResponse } from 'src/app/api';
import { ProblemsComponent } from '../../tools/problems/problems.component';
import { environment } from '../../../environments/environment';

const LIST_PROBLEM_SET_URL = `//${environment.backendHost}/oj/listProblemSets`;
const LIST_PROBLEM_URL = `//${environment.backendHost}/oj/listProblems/`;

@Component({
  selector: 'app-sidebar-problem',
  templateUrl: './sidebar-problem.component.html',
  styleUrls: ['./sidebar-problem.component.scss']
})
export class SidebarProblemComponent implements OnInit {
  problemInfo: string[] | null = null;
  description: {
    title: string;
    description: string;
    aboutInput: string;
    aboutOutput: string;
    sampleInput: string;
    sampleOutput: string;
    hint: string;
  } | null = null;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    (window as any).sbp = this;
  }


  async loadProblem(node: NzCascaderOption, index: number): Promise<void> {
    // http.get doesn't work! use fetch instead.
    if (index === -1) {
      // load set list
      const res: OjListProblemSetsResponse = await fetch(LIST_PROBLEM_SET_URL).then(r => r.json());
      if (!res.success) {
        alert("Load set list failed");
        return;
      }
      node.children = res.problemSets.map<NzCascaderOption>(set => ({
        value: set.problemSetId,
        label: set.title,
        disabled: set.status !== 'ok',
        isLeaf: false
      }));
    } else if (index === 0) {
      // load problem list
      const res: OjListProblemsResponse = await fetch(LIST_PROBLEM_URL + node.value).then(r => r.json());
      if (!res.success) {
        alert("Load problem list failed");
        return;
      }
      node.children = res.problems.map<NzCascaderOption>(problem => ({
        value: problem.problemId,
        title: problem.title,
        label: (problem.status === 'accepted' ? '✔' : problem.status === 'tried' ? '❌' : '' ) + problem.title,
        parent: node,
        isLeaf: true
      }));
    }
  }

  async updateDescription() {
    this.description = await (async () => {
      console.log(this.problemInfo);
      if (this.problemInfo === null) return null;
      const [setId, problemId] = this.problemInfo;
      const res: OjGetProblemResponse = await fetch(`//${environment.backendHost}/oj/getProblem/${setId}/${problemId}`).then(r => r.json());
      if (!res.success) {
        alert("Load problem failed");
        return null;
      }
      return res;
    })();
  }

}
