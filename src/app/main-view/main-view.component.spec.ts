import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainViewComponent } from './main-view.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule  } from 'node_modules/@angular/router/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { HttpClientModule } from '@angular/common/http';
describe('MainViewComponent', () => {
  let component: MainViewComponent;
  let fixture: ComponentFixture<MainViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule,
        HttpClientModule
      ],
      declarations: [ MainViewComponent ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
/*
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('init sidebar', () =>{
    expect(component.showSidebar).toHaveBeenCalled();
  }
  );
  it('init toolbar', () =>{
    expect(component.showTools).toHaveBeenCalled();
  }
  );
  */
});
