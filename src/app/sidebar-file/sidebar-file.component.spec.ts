import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarFileComponent } from './sidebar-file.component';

describe('SidebarFileComponent', () => {
  let component: SidebarFileComponent;
  let fixture: ComponentFixture<SidebarFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SidebarFileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
