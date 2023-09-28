import { TestBed } from '@angular/core/testing';

import { ResourcePoolsService } from './resource-pools.service';

describe('ResourcePoolsService', () => {
  let service: ResourcePoolsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResourcePoolsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
