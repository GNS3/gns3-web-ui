import { TestBed } from '@angular/core/testing';

import { GroupMembersResolver } from './group-members.resolver';

describe('GroupDetailsResolver', () => {
  let resolver: GroupMembersResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(GroupMembersResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
