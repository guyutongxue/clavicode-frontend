import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FileioComponent } from './fileio.component';
import { RouterTestingModule} from 'node_modules/@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { DialogService } from '@ngneat/dialog'; 
describe('FileioComponent', () => {
  let component: FileioComponent;
  let fixture: ComponentFixture<FileioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule,
        HttpClientModule,
      ],
      declarations: [ FileioComponent ],
      schemas: [NO_ERRORS_SCHEMA],
      providers:[
        DialogService
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  //it('should create', () => {
  //  expect(component).toBeTruthy();
  //});
});
