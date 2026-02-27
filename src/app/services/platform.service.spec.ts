import { TestBed } from '@angular/core/testing';
import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  let service: PlatformService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlatformService],
    });
  });

  beforeEach(() => {
    service = TestBed.get(PlatformService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect Windows platform', () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
    });
    expect(service.isWindows()).toBeTruthy();
    expect(service.isDarwin()).toBeFalsy();
    expect(service.isLinux()).toBeFalsy();
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it('should detect Linux platform', () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; Linux x86_64)',
      configurable: true,
    });
    expect(service.isWindows()).toBeFalsy();
    expect(service.isDarwin()).toBeFalsy();
    expect(service.isLinux()).toBeTruthy();
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it('should detect Darwin/Mac platform', () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true,
    });
    expect(service.isWindows()).toBeFalsy();
    expect(service.isDarwin()).toBeTruthy();
    expect(service.isLinux()).toBeFalsy();
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });
});
