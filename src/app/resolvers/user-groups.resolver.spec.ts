import { TestBed } from '@angular/core/testing';

import { UserGroupsResolver } from './user-groups.resolver';

describe('UserGroupsResolver', () => {
  let resolver: UserGroupsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(UserGroupsResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
