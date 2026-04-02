import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  let service: PlatformService;
  let originalPlatform: string;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform')?.toString() || '';
    service = new PlatformService();
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
    it('should return true for Windows platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });

      const result = new PlatformService().isWindows();
      expect(result).toBe(true);
    });

    it('should return false for non-Windows platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Macintosh',
        writable: true,
      });

      const result = new PlatformService().isWindows();
      expect(result).toBe(false);
    });
  });

  describe('isLinux', () => {
    it('should return true for Linux platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        writable: true,
      });

      const result = new PlatformService().isLinux();
      expect(result).toBe(true);
    });

    it('should return false for non-Linux platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });

      const result = new PlatformService().isLinux();
      expect(result).toBe(false);
    });
  });

  describe('isDarwin', () => {
    it('should return true for Mac platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Macintosh',
        writable: true,
      });

      const result = new PlatformService().isDarwin();
      expect(result).toBe(true);
    });

    it('should return false for non-Mac platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux',
        writable: true,
      });

      const result = new PlatformService().isDarwin();
      expect(result).toBe(false);
    });
  });
});
