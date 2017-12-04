import { TestBed, inject } from '@angular/core/testing';

import { LinkService } from './link.service';

describe('LinkService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LinkService]
    });
  });

  it('should be created', inject([LinkService], (service: LinkService) => {
    expect(service).toBeTruthy();
  }));
});
