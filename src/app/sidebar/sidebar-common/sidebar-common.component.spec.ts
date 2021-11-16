import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarCommonComponent } from './sidebar-common.component';

describe('SidebarCommonComponent', () => {
  let component: SidebarCommonComponent;
  let fixture: ComponentFixture<SidebarCommonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SidebarCommonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
