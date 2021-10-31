import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecuteDialogComponent } from './execute-dialog.component';

describe('ExecuteDialogComponent', () => {
  let component: ExecuteDialogComponent;
  let fixture: ComponentFixture<ExecuteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExecuteDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecuteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
