import { TestBed } from '@angular/core/testing';

import { AclService } from './acl.service';

describe('AclService', () => {
  let service: AclService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AclService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
