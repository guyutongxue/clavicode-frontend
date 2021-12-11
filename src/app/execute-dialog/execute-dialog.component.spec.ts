import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExecuteDialogComponent } from './execute-dialog.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
describe('ExecuteDialogComponent', () => {
  let component: ExecuteDialogComponent;
  let fixture: ComponentFixture<ExecuteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[DialogRef,
        BrowserDynamicTestingModule],
      declarations: [ ExecuteDialogComponent ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecuteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  //it('should create', () => {
  //  expect(component).toBeTruthy();
  //});
});
