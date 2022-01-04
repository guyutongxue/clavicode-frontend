import { TestBed } from '@angular/core/testing';

import { FileLocalService } from './file-local.service';

describe('FileLocalService', () => {
  let service: FileLocalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileLocalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
