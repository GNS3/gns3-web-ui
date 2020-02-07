import { inject, TestBed } from '@angular/core/testing';

import { ProgressDialogService } from './progress-dialog.service';

describe('ProgressDialogService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProgressDialogService]
    });
  });

  // it('should be created', inject([ProgressDialogService], (service: ProgressDialogService) => {
  //   expect(service).toBeTruthy();
  // }));
});
