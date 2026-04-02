import { describe, it, expect, beforeEach } from 'vitest';
import { IouConfigurationService } from './iou-configuration.service';

describe('IouConfigurationService', () => {
  let service: IouConfigurationService;

  beforeEach(() => {
    service = new IouConfigurationService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of IouConfigurationService', () => {
      expect(service).toBeInstanceOf(IouConfigurationService);
    });
  });

  describe('getConsoleTypes', () => {
    it('should return telnet and none console types', () => {
      const result = service.getConsoleTypes();

      expect(result).toEqual(['telnet', 'none']);
    });
  });

  describe('getCategories', () => {
    it.each([
      ['Default', 'guest'],
      ['Routers', 'router'],
      ['Switches', 'switch'],
      ['End devices', 'guest'],
      ['Security devices', 'firewall'],
    ])('should include %s category with %s', (name, deviceType) => {
      const result = service.getCategories();
      expect(result).toContainEqual([name, deviceType]);
    });

    it('should return independent array each call', () => {
      const result1 = service.getCategories();
      const result2 = service.getCategories();

      expect(result1).not.toBe(result2);
    });
  });
});
