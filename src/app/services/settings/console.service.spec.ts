import { TestBed } from '@angular/core/testing';

import { ConsoleService } from './console.service';

describe('ConsoleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ConsoleService = TestBed.get(ConsoleService);
    expect(service).toBeTruthy();
  });
});
