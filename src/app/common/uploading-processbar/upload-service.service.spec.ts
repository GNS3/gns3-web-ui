import { TestBed, provideZonelessChangeDetection } from '@angular/core/testing';

import { UploadServiceService } from './upload-service.service';

describe('UploadServiceService', () => {
  let service: UploadServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(UploadServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
