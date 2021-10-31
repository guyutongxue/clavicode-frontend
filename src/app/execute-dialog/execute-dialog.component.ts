import { Component, OnInit, TemplateRef } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';

@Component({
  selector: 'app-execute-dialog',
  templateUrl: './execute-dialog.component.html',
  styleUrls: ['./execute-dialog.component.scss']
})
export class ExecuteDialogComponent implements OnInit {

  constructor(private dialogRef: DialogRef) { }

  ngOnInit(): void {
  }

}
