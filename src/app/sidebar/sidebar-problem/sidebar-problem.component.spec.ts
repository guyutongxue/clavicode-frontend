import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarProblemComponent } from './sidebar-problem.component';
import { HttpClient } from '@angular/common/http';
import { OjService } from 'src/app/services/oj.service';
import { ActionService } from 'src/app/services/action.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from 'node_modules/@angular/router/testing';
  
describe('SidebarProblemComponent', () => {
  let component: SidebarProblemComponent;
  let fixture: ComponentFixture<SidebarProblemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SidebarProblemComponent ],
      schemas: [
        NO_ERRORS_SCHEMA
      ],
      providers: [
        HttpClient,
        OjService,
        ActionService,
        RouterModule,
        Router
      ],
      imports: [
        RouterTestingModule
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarProblemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  //it('should create', () => {
  //  expect(component).toBeTruthy();
  //});
});
