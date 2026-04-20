import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  let service: PlatformService;
  let originalPlatform: string | undefined;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform')?.value;
    service = new PlatformService();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of PlatformService', () => {
      expect(service).toBeInstanceOf(PlatformService);
    });
  });

  describe('isWindows', () => {
    it.each([
      { platform: 'Win32', expected: true },
      { platform: 'Windows', expected: true },
      { platform: 'Win64', expected: true },
    ])('should return $expected for platform $platform', ({ platform, expected }) => {
      Object.defineProperty(navigator, 'platform', { value: platform, writable: true });
      expect(service.isWindows()).toBe(expected);
    });

    it.each([
      { platform: 'Macintosh', expected: false },
      { platform: 'Linux x86_64', expected: false },
      { platform: '', expected: false },
    ])('should return $expected for non-Windows platform $platform', ({ platform, expected }) => {
      Object.defineProperty(navigator, 'platform', { value: platform, writable: true });
      expect(service.isWindows()).toBe(expected);
    });
  });

  describe('isLinux', () => {
    it.each([
      { platform: 'Linux x86_64', expected: true },
      { platform: 'Linux', expected: true },
    ])('should return $expected for platform $platform', ({ platform, expected }) => {
      Object.defineProperty(navigator, 'platform', { value: platform, writable: true });
      expect(service.isLinux()).toBe(expected);
    });

    it.each([
      { platform: 'Win32', expected: false },
      { platform: 'Macintosh', expected: false },
      { platform: '', expected: false },
    ])('should return $expected for non-Linux platform $platform', ({ platform, expected }) => {
      Object.defineProperty(navigator, 'platform', { value: platform, writable: true });
      expect(service.isLinux()).toBe(expected);
    });
  });

  describe('isDarwin', () => {
    it.each([
      { platform: 'Macintosh', expected: true },
      { platform: 'MacOS', expected: true },
    ])('should return $expected for platform $platform', ({ platform, expected }) => {
      Object.defineProperty(navigator, 'platform', { value: platform, writable: true });
      expect(service.isDarwin()).toBe(expected);
    });

    it.each([
      { platform: 'Win32', expected: false },
      { platform: 'Linux x86_64', expected: false },
      { platform: '', expected: false },
    ])('should return $expected for non-Mac platform $platform', ({ platform, expected }) => {
      Object.defineProperty(navigator, 'platform', { value: platform, writable: true });
      expect(service.isDarwin()).toBe(expected);
    });
  });
});
