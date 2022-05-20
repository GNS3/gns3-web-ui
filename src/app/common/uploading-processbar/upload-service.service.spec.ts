import { TestBed } from '@angular/core/testing';

import { UploadServiceService } from './upload-service.service';

describe('UploadServiceService', () => {
  let service: UploadServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UploadServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
