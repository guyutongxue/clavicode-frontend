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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OjGetProblemResponse, OjGetSolutionResponse, OjListProblemSetsResponse, OjListProblemsResponse, OjSubmitRequest, OjSubmitResponse } from '../api';
import { EditorService } from './editor.service';

type ProblemDescription = {
  title: string;
  description: string;
  aboutInput: string;
  aboutOutput: string;
  sampleInput: string;
  sampleOutput: string;
  hint: string;
};

type Solution = {
  status: string;
  hint?: string;
  memory?: string;
  time?: string;
}

const LIST_PROBLEM_SET_URL = `//${environment.backendHost}/oj/listProblemSets`;
const LIST_PROBLEM_URL = `//${environment.backendHost}/oj/listProblems/`;


@Injectable({
  providedIn: 'root'
})
export class OjService {

  problemDescription: ProblemDescription | null = null;
  problemId: string[] = [];
  solution = new BehaviorSubject<Solution | null>(null);

  constructor(
    private router: Router,
    private http: HttpClient,
    private editorService: EditorService) { }

  async listProblemSets() {
    const res = await this.http.get<OjListProblemSetsResponse>(LIST_PROBLEM_SET_URL).toPromise();
    if (!res.success) {
      alert("Load set list failed");
      return null;
    }
    return res.problemSets;
  }

  async listProblems(setId: string) {
    const res = await this.http.get<OjListProblemsResponse>(LIST_PROBLEM_URL + setId).toPromise();
    if (!res.success) {
      alert("Load problem list failed");
      return null;
    }
    return res.problems;
  }

  hasProblem() {
    return this.problemId.length > 0;
  }

  async updateDescription(value: string[]) {
    this.problemId = value;
    this.problemDescription = await (async () => {
      console.log(this.problemId);
      if (!this.hasProblem()) return null;
      const [setId, problemId] = this.problemId;
      const res = await this.http.get<OjGetProblemResponse>(`//${environment.backendHost}/oj/getProblem/${setId}/${problemId}`).toPromise();
      if (!res.success) {
        alert("Load problem failed");
        return null;
      }
      return res;
    })();
  }

  async submit() {
    if (!this.hasProblem()) return;
    const [setId, problemId] = this.problemId;
    this.solution.next({ status: 'Waiting' });
    this.showSolution();
    const res = await this.http.post<OjSubmitResponse>(`//${environment.backendHost}/oj/submit`, <OjSubmitRequest>{
      code: this.editorService.getCode(),
      problemId: problemId,
      problemSetId: setId
    }).toPromise();
    if (!res.success) {
      alert("Submit failed");
      return;
    }
    this.getSolution(res.solutionId);
  }

  async getSolution(id: string) {
    const res = await this.http.get<OjGetSolutionResponse>(`//${environment.backendHost}/oj/getSolution/${id}`).toPromise();
    if (!res.success) {
      alert("Get solution failed");
      return;
    }
    this.solution.next({
      status: res.status,
      hint: res.hint,
      memory: res.memory,
      time: res.time
    });
  }

  showSolution() {
    this.router.navigate([{ outlets: { tools: ['output', 'solution'] } }], { skipLocationChange: true });
  }

}
