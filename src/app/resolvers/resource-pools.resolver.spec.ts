import { TestBed } from '@angular/core/testing';

import { ResourcePoolsResolver } from './resource-pools.resolver';

describe('ResourcePoolsResolver', () => {
  let resolver: ResourcePoolsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(ResourcePoolsResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
