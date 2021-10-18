import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UIDemoComponent } from './ui-demo.component';

describe('UIDemoComponent', () => {
  let component: UIDemoComponent;
  let fixture: ComponentFixture<UIDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UIDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UIDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
