import { TestBed, inject } from '@angular/core/testing';

import { ApplianceService } from './appliance.service';

describe('ApplianceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApplianceService]
    });
  });

  // it('should be created', inject([ApplianceService], (service: ApplianceService) => {
  //   expect(service).toBeTruthy();
  // }));
});
