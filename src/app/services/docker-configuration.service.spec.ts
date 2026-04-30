import { describe, it, expect, beforeEach } from 'vitest';
import { DockerConfigurationService } from './docker-configuration.service';

describe('DockerConfigurationService', () => {
  let service: DockerConfigurationService;

  beforeEach(() => {
    service = new DockerConfigurationService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of DockerConfigurationService', () => {
      expect(service).toBeInstanceOf(DockerConfigurationService);
    });
  });

  describe('getConsoleTypes', () => {
    it('should return 6 console types', () => {
      const result = service.getConsoleTypes();
      expect(result).toHaveLength(6);
    });

    it('should include telnet, ssh, vnc, http, https, none', () => {
      const result = service.getConsoleTypes();
      expect(result).toContain('telnet');
      expect(result).toContain('ssh');
      expect(result).toContain('vnc');
      expect(result).toContain('http');
      expect(result).toContain('https');
      expect(result).toContain('none');
    });
  });

  describe('getAuxConsoleTypes', () => {
    it('should return 3 aux console types', () => {
      const result = service.getAuxConsoleTypes();
      expect(result).toHaveLength(3);
    });

    it('should include telnet, ssh and none', () => {
      const result = service.getAuxConsoleTypes();
      expect(result).toContain('telnet');
      expect(result).toContain('ssh');
      expect(result).toContain('none');
    });
  });

  describe('getCategories', () => {
    it('should return 5 categories', () => {
      const result = service.getCategories();
      expect(result).toHaveLength(5);
    });

    it('should include Default category', () => {
      expect(service.getCategories()).toContainEqual(['Default', 'guest']);
    });

    it('should include Routers category', () => {
      expect(service.getCategories()).toContainEqual(['Routers', 'router']);
    });

    it('should return independent array each call', () => {
      const result1 = service.getCategories();
      const result2 = service.getCategories();
      expect(result1).not.toBe(result2);
    });
  });

  describe('getConsoleResolutions', () => {
    it('should return 10 resolutions', () => {
      const result = service.getConsoleResolutions();
      expect(result).toHaveLength(10);
    });

    it('should include common resolutions', () => {
      const result = service.getConsoleResolutions();
      expect(result).toContain('1920x1080');
      expect(result).toContain('1280x1024');
      expect(result).toContain('800x600');
    });

    it('should start with highest resolution', () => {
      const result = service.getConsoleResolutions();
      expect(result[0]).toBe('2560x1440');
    });

    it('should end with lowest resolution', () => {
      const result = service.getConsoleResolutions();
      expect(result[result.length - 1]).toBe('640x480');
    });
  });

  describe('getMacAddrRegex', () => {
    it('should return a RegExp', () => {
      const result = service.getMacAddrRegex();
      expect(result).toBeInstanceOf(RegExp);
    });

    it('should match valid MAC addresses', () => {
      const regex = service.getMacAddrRegex();
      expect(regex.test('00:00:00:00:00:00')).toBe(true);
      expect(regex.test('AA:BB:CC:DD:EE:FF')).toBe(true);
      expect(regex.test('12:34:56:78:90:ab')).toBe(true);
    });

    it('should not match invalid MAC addresses', () => {
      const regex = service.getMacAddrRegex();
      expect(regex.test('00:00:00:00:00')).toBe(false);
      expect(regex.test('00:00:00:00:00:00:00')).toBe(false);
      expect(regex.test('gg:gg:gg:gg:gg:gg')).toBe(false);
      expect(regex.test('1234567890ab')).toBe(false);
    });
  });
});
