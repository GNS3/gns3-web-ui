import { describe, it, expect, beforeEach } from 'vitest';
import { VpcsConfigurationService } from './vpcs-configuration.service';

describe('VpcsConfigurationService', () => {
  let service: VpcsConfigurationService;

  beforeEach(() => {
    service = new VpcsConfigurationService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of VpcsConfigurationService', () => {
      expect(service).toBeInstanceOf(VpcsConfigurationService);
    });
  });

  describe('getConsoleTypes', () => {
    it('should return exactly telnet, ssh and none', () => {
      expect(service.getConsoleTypes()).toEqual(['telnet', 'ssh', 'none']);
    });

    it('should return array with exactly 3 console types', () => {
      expect(service.getConsoleTypes()).toHaveLength(3);
    });

    it('should return independent array on each call', () => {
      const result1 = service.getConsoleTypes();
      const result2 = service.getConsoleTypes();
      expect(result1).not.toBe(result2);
    });
  });

  describe('getCategories', () => {
    it('should return array of category name and type pairs', () => {
      const result = service.getCategories();
      expect(result).toBeInstanceOf(Array);
      expect(result.every(Array.isArray)).toBe(true);
    });

    it('should return exactly 5 categories in correct order', () => {
      expect(service.getCategories()).toEqual([
        ['Default', 'guest'],
        ['Routers', 'router'],
        ['Switches', 'switch'],
        ['End devices', 'guest'],
        ['Security devices', 'firewall'],
      ]);
    });

    it.each([
      ['Default', 'guest'],
      ['Routers', 'router'],
      ['Switches', 'switch'],
      ['End devices', 'guest'],
      ['Security devices', 'firewall'],
    ])('should include $0 category with $1', (name, value) => {
      expect(service.getCategories()).toContainEqual([name, value]);
    });

    it('should return independent array on each call', () => {
      const result1 = service.getCategories();
      const result2 = service.getCategories();
      expect(result1).not.toBe(result2);
    });

    it('should have valid category types', () => {
      const result = service.getCategories();
      const validTypes = ['guest', 'router', 'switch', 'firewall'];
      result.forEach((category) => {
        expect(validTypes).toContain(category[1]);
      });
    });
  });
});
