import { describe, it, expect, beforeEach } from 'vitest';
import { BuiltInTemplatesConfigurationService } from './built-in-templates-configuration.service';

describe('BuiltInTemplatesConfigurationService', () => {
  let service: BuiltInTemplatesConfigurationService;

  beforeEach(() => {
    service = new BuiltInTemplatesConfigurationService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of BuiltInTemplatesConfigurationService', () => {
      expect(service).toBeInstanceOf(BuiltInTemplatesConfigurationService);
    });
  });

  describe('getCategoriesForCloudNodes', () => {
    it('should return 5 categories', () => {
      const result = service.getCategoriesForCloudNodes();
      expect(result).toHaveLength(5);
    });

    it('should include Default category', () => {
      expect(service.getCategoriesForCloudNodes()).toContainEqual(['Default', 'guest']);
    });

    it('should return independent array each call', () => {
      const result1 = service.getCategoriesForCloudNodes();
      const result2 = service.getCategoriesForCloudNodes();
      expect(result1).not.toBe(result2);
    });
  });

  describe('getConsoleTypesForCloudNodes', () => {
    it('should return 7 console types', () => {
      const result = service.getConsoleTypesForCloudNodes();
      expect(result).toHaveLength(7);
    });

    it('should include telnet, ssh, vnc, spice, http, https, none', () => {
      const result = service.getConsoleTypesForCloudNodes();
      expect(result).toContain('telnet');
      expect(result).toContain('ssh');
      expect(result).toContain('vnc');
      expect(result).toContain('spice');
      expect(result).toContain('http');
      expect(result).toContain('https');
      expect(result).toContain('none');
    });
  });

  describe('getCategoriesForEthernetHubs', () => {
    it('should return 5 categories', () => {
      const result = service.getCategoriesForEthernetHubs();
      expect(result).toHaveLength(5);
    });

    it('should include Default category', () => {
      expect(service.getCategoriesForEthernetHubs()).toContainEqual(['Default', 'guest']);
    });
  });

  describe('getCategoriesForEthernetSwitches', () => {
    it('should return 5 categories', () => {
      const result = service.getCategoriesForEthernetSwitches();
      expect(result).toHaveLength(5);
    });

    it('should include Default category', () => {
      expect(service.getCategoriesForEthernetSwitches()).toContainEqual(['Default', 'guest']);
    });
  });

  describe('getConsoleTypesForEthernetSwitches', () => {
    it('should return telnet and none', () => {
      const result = service.getConsoleTypesForEthernetSwitches();
      expect(result).toContain('telnet');
      expect(result).toContain('none');
    });

    it('should return 2 console types', () => {
      expect(service.getConsoleTypesForEthernetSwitches()).toHaveLength(2);
    });
  });

  describe('getPortTypesForEthernetSwitches', () => {
    it('should return access, dot1q, qinq', () => {
      const result = service.getPortTypesForEthernetSwitches();
      expect(result).toContain('access');
      expect(result).toContain('dot1q');
      expect(result).toContain('qinq');
    });

    it('should return 3 port types', () => {
      expect(service.getPortTypesForEthernetSwitches()).toHaveLength(3);
    });
  });

  describe('getEtherTypesForEthernetSwitches', () => {
    it('should return 4 ether types', () => {
      const result = service.getEtherTypesForEthernetSwitches();
      expect(result).toHaveLength(4);
    });

    it('should return correct ether type values', () => {
      const result = service.getEtherTypesForEthernetSwitches();
      expect(result).toContain('0x8100');
      expect(result).toContain('0x88A8');
      expect(result).toContain('0x9100');
      expect(result).toContain('0x9200');
    });
  });
});
