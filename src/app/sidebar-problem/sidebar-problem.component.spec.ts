import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarProblemComponent } from './sidebar-problem.component';

describe('SidebarProblemComponent', () => {
  let component: SidebarProblemComponent;
  let fixture: ComponentFixture<SidebarProblemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SidebarProblemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarProblemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
