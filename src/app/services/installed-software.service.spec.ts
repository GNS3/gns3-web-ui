import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InstalledSoftwareService } from './installed-software.service';

describe('InstalledSoftwareService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: InstalledSoftwareService, useValue: {} }],
    })
  );

  it('should be created', () => {
    const service: InstalledSoftwareService = TestBed.inject(InstalledSoftwareService);
    expect(service).toBeTruthy();
  });
});
