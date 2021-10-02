import { TestBed } from '@angular/core/testing';

import { ExecuteService } from './execute.service';

describe('ExecuteService', () => {
  let service: ExecuteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExecuteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
