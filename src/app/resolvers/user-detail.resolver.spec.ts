import { TestBed } from '@angular/core/testing';

import { UserDetailResolver } from './user-detail.resolver';

describe('UserDetailResolver', () => {
  let resolver: UserDetailResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(UserDetailResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
