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
    it('should return telnet and none console types', () => {
      const result = service.getConsoleTypes();

      expect(result).toContain('telnet');
      expect(result).toContain('none');
    });

    it('should return array with exactly 2 console types', () => {
      const result = service.getConsoleTypes();

      expect(result).toHaveLength(2);
    });
  });

  describe('getCategories', () => {
    it('should return categories array', () => {
      const result = service.getCategories();

      expect(result).toBeInstanceOf(Array);
    });

    it('should return 5 categories', () => {
      const result = service.getCategories();

      expect(result).toHaveLength(5);
    });

    it('should include Default category with guest', () => {
      const result = service.getCategories();

      expect(result).toContainEqual(['Default', 'guest']);
    });

    it('should include Routers category with router', () => {
      const result = service.getCategories();

      expect(result).toContainEqual(['Routers', 'router']);
    });

    it('should include Switches category with switch', () => {
      const result = service.getCategories();

      expect(result).toContainEqual(['Switches', 'switch']);
    });

    it('should include End devices category with guest', () => {
      const result = service.getCategories();

      expect(result).toContainEqual(['End devices', 'guest']);
    });

    it('should include Security devices category with firewall', () => {
      const result = service.getCategories();

      expect(result).toContainEqual(['Security devices', 'firewall']);
    });

    it('should return independent array each call', () => {
      const result1 = service.getCategories();
      const result2 = service.getCategories();

      expect(result1).not.toBe(result2);
    });
  });
});
