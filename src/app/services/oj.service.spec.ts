import { TestBed } from '@angular/core/testing';

import { OjService } from './oj.service';

describe('OjService', () => {
  let service: OjService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OjService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
