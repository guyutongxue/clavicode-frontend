import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { XtermComponent } from './xterm.component';
import { ExecuteService } from 'src/app/services/execute.service';
import { DialogService } from '@ngneat/dialog'; 
import { RouterTestingModule  } from 'node_modules/@angular/router/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { HttpClientModule } from '@angular/common/http';
describe('XtermComponent', () => {
  let component: XtermComponent;
  let fixture: ComponentFixture<XtermComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule,
        HttpClientModule,
        BrowserDynamicTestingModule
      ],
      declarations: [ XtermComponent ],
      schemas: [
        NO_ERRORS_SCHEMA
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XtermComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  //it('should create', () => {
  //  expect(component).toBeTruthy();
  //});
});
