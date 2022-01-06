import { TestBed } from '@angular/core/testing';

import { PyodideService } from './pyodide.service';

describe('PyodideService', () => {
  let service: PyodideService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PyodideService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
