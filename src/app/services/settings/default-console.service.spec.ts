import { TestBed } from '@angular/core/testing';

import { DefaultConsoleService } from './default-console.service';

describe('DefaultConsoleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DefaultConsoleService = TestBed.get(DefaultConsoleService);
    expect(service).toBeTruthy();
  });
});
