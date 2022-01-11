import { TestBed } from '@angular/core/testing';

import { GroupRoleResolver } from './group-role.resolver';

describe('GroupRoleResolver', () => {
  let resolver: GroupRoleResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(GroupRoleResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
