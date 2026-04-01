import { describe, it, expect, beforeEach } from 'vitest';
import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  let service: PlatformService;

  beforeEach(() => {
    service = new PlatformService();
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  describe('isWindows', () => {
    it('should return true for Win32', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
        configurable: true,
      });
      expect(service.isWindows()).toBe(true);
    });

    it('should return true for Win64', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win64',
        writable: true,
        configurable: true,
      });
      expect(service.isWindows()).toBe(true);
    });

    it('should return false for Linux', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux',
        writable: true,
        configurable: true,
      });
      expect(service.isWindows()).toBe(false);
    });
  });

  describe('isLinux', () => {
    it('should return true for Linux x86_64', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        writable: true,
        configurable: true,
      });
      expect(service.isLinux()).toBe(true);
    });

    it('should return false for Win32', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
        configurable: true,
      });
      expect(service.isLinux()).toBe(false);
    });
  });

  describe('isDarwin', () => {
    it('should return true for MacIntel', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
        configurable: true,
      });
      expect(service.isDarwin()).toBe(true);
    });

    it('should return true for MacARM', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacARM',
        writable: true,
        configurable: true,
      });
      expect(service.isDarwin()).toBe(true);
    });

    it('should return false for Linux', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux',
        writable: true,
        configurable: true,
      });
      expect(service.isDarwin()).toBe(false);
    });
  });
});
