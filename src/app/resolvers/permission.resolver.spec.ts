import { TestBed } from '@angular/core/testing';

import { PermissionResolver } from './permission.resolver';

describe('PermissionResolver', () => {
  let resolver: PermissionResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(PermissionResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
