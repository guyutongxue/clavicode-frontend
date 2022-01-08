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

import { Component, OnInit, TemplateRef } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';
import { StatusService } from '../services/status.service';

@Component({
  selector: 'app-execute-dialog',
  templateUrl: './execute-dialog.component.html',
  styleUrls: ['./execute-dialog.component.scss']
})
export class ExecuteDialogComponent implements OnInit {

  constructor(
    private dialogRef: DialogRef,
    private statusService: StatusService) { }

  get remote() {
    return ["remote-executing", "debugging"].includes(this.statusService.value);
  }

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close();
  }

}
