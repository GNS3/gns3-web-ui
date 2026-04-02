import { describe, it, expect, beforeEach } from 'vitest';
import { VmwareConfigurationService } from './vmware-configuration.service';

describe('VmwareConfigurationService', () => {
  let service: VmwareConfigurationService;

  beforeEach(() => {
    service = new VmwareConfigurationService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of VmwareConfigurationService', () => {
      expect(service).toBeInstanceOf(VmwareConfigurationService);
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
    it('should return 8 network types', () => {
      const result = service.getNetworkTypes();
      expect(result).toHaveLength(8);
    });

    it('should include e1000 and vmxnet', () => {
      const result = service.getNetworkTypes();
      expect(result).toContain('e1000');
      expect(result).toContain('vmxnet3');
    });

    it('should include default', () => {
      expect(service.getNetworkTypes()).toContain('default');
    });
  });
});
