import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualBoxConfigurationService } from './virtual-box-configuration.service';

describe('VirtualBoxConfigurationService', () => {
  let service: VirtualBoxConfigurationService;

  beforeEach(() => {
    service = new VirtualBoxConfigurationService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of VirtualBoxConfigurationService', () => {
      expect(service).toBeInstanceOf(VirtualBoxConfigurationService);
    });
  });

  describe('getConsoleTypes', () => {
    it('should return telnet and none', () => {
      const result = service.getConsoleTypes();
      expect(result).toContain('telnet');
      expect(result).toContain('none');
    });

    it('should return 2 console types', () => {
      expect(service.getConsoleTypes()).toHaveLength(2);
    });
  });

  describe('getOnCloseoptions', () => {
    it('should return 3 on close options', () => {
      const result = service.getOnCloseoptions();
      expect(result).toHaveLength(3);
    });

    it('should include power_off option', () => {
      expect(service.getOnCloseoptions()).toContainEqual(['Power off the VM', 'power_off']);
    });

    it('should include shutdown_signal option', () => {
      expect(service.getOnCloseoptions()).toContainEqual(['Send the shutdown signal (ACPI)', 'shutdown_signal']);
    });

    it('should include save_vm_state option', () => {
      expect(service.getOnCloseoptions()).toContainEqual(['Save the VM state', 'save_vm_state']);
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
  });

  describe('getNetworkTypes', () => {
    it('should return 6 network types', () => {
      const result = service.getNetworkTypes();
      expect(result).toHaveLength(6);
    });

    it('should include PCnet network types', () => {
      const result = service.getNetworkTypes();
      expect(result.some((n) => n.includes('PCnet'))).toBe(true);
    });

    it('should include Intel PRO/1000 network types', () => {
      const result = service.getNetworkTypes();
      expect(result.some((n) => n.includes('Intel PRO/1000'))).toBe(true);
    });

    it('should include virtio network type', () => {
      const result = service.getNetworkTypes();
      expect(result.some((n) => n.includes('virtio'))).toBe(true);
    });
  });
});
