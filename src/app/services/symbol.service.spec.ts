import { TestBed, inject } from '@angular/core/testing';

import { SymbolService } from './symbol.service';

describe('SymbolService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SymbolService]
    });
  });

  it('should be created', inject([SymbolService], (service: SymbolService) => {
    expect(service).toBeTruthy();
  }));
});
