import { TestBed } from '@angular/core/testing';

import { UserPermissionsResolver } from './user-permissions.resolver';

describe('UserPermissionsResolver', () => {
  let resolver: UserPermissionsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(UserPermissionsResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
