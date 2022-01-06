import { TestBed } from '@angular/core/testing';

import { RoleDetailResolver } from './role-detail.resolver';

describe('RoleDetailResolver', () => {
  let resolver: RoleDetailResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(RoleDetailResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
