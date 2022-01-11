import { TestBed } from '@angular/core/testing';

import { GroupResolver } from './group.resolver';

describe('GroupResolver', () => {
  let resolver: GroupResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(GroupResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
