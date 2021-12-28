import { TestBed } from '@angular/core/testing';

import { GroupDetailsResolver } from './group-details.resolver';

describe('GroupDetailsResolver', () => {
  let resolver: GroupDetailsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(GroupDetailsResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
