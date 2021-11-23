import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OjService } from 'src/app/services/oj.service';


@Component({
  selector: 'app-solution',
  templateUrl: './solution.component.html',
  styleUrls: ['./solution.component.scss']
})
export class SolutionComponent implements OnInit {


  readonly abbrMap: Record<string, string> = {
    'Passed': 'AC',
    'Accepted': 'AC',
    'WrongAnswer': 'WA',
    'RuntimeError': 'RE',
    'CompileError': 'CE',
    'TimeLimitExceeded': 'TLE',
    'MemoryLimitExceeded': 'MLE',
    "Waiting": "...",

    'Unknown': 'UNK'
  };

  readonly colorMap: Record<string, string> = {
    'Passed': '#52C41A',
    "Accepted": "#52C41A",
    "WrongAnswer": "#E74C3C",
    "PresentationError": "#00A497",
    "TimeLimitExceeded": "#052242",
    "MemoryLimitExceeded": "#052242",
    "OutputLimitExceeded": "#E74C3C",
    "RuntimeError": "#9D3DCF",
    "CompileError": "#FADB14",
    "Waiting": "#14558F",
    "ProblemDisabled": "#AAAAAA",
    "RunningAndJudging": "#14558F",
    "SystemError": "#CC317C",
    "ValidatorError": "#CC317C",

    "Unknown": "#CC317C"
  };

  currentStatus: string | null = null;
  currentHint: string = '';

  constructor(private ojService: OjService) { }

  ngOnInit(): void {
    this.ojService.solution.subscribe((solution) => {
      if (solution === null) {
        this.currentStatus = null;
        return;
      }
      this.currentStatus = solution.status;
      this.currentHint = solution.hint ?? '';
    });
  }

}
