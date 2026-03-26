import { TestBed, provideZonelessChangeDetection } from '@angular/core/testing';
import { InstalledSoftwareService } from './installed-software.service';

describe('InstalledSoftwareService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: InstalledSoftwareService, useValue: {} }],
    })
  );

  it('should be created', () => {
    const service: InstalledSoftwareService = TestBed.get(InstalledSoftwareService);
    expect(service).toBeTruthy();
  });
});
