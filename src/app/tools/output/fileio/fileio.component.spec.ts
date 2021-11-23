import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileioComponent } from './fileio.component';

describe('FileioComponent', () => {
  let component: FileioComponent;
  let fixture: ComponentFixture<FileioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
