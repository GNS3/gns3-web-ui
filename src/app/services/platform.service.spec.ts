import { TestBed, provideZonelessChangeDetection } from '@angular/core/testing';

import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  let service: PlatformService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), PlatformService],
    });
  });

  beforeEach(() => {
    service = TestBed.get(PlatformService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect platform methods', () => {
    // Platform detection is based on navigator.platform
    expect(typeof service.isWindows).toBe('function');
    expect(typeof service.isLinux).toBe('function');
    expect(typeof service.isDarwin).toBe('function');
  });
});
