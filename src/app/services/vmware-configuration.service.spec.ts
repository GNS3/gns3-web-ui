import { describe, it, expect, beforeEach } from 'vitest';
import { VmwareConfigurationService } from './vmware-configuration.service';

describe('VmwareConfigurationService', () => {
  let service: VmwareConfigurationService;

  beforeEach(() => {
    service = new VmwareConfigurationService();
  });

  describe('Service Creation', () => {
    it('should be truthy when instantiated', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of VmwareConfigurationService', () => {
      expect(service).toBeInstanceOf(VmwareConfigurationService);
    });
  });

  describe('getConsoleTypes', () => {
    it('should return all console types with correct values', () => {
      const result = service.getConsoleTypes();

      expect(result).toEqual(['telnet', 'none']);
    });

    it.each(['telnet', 'none'])('should include console type: %s', (type) => {
      expect(service.getConsoleTypes()).toContain(type);
    });
  });

  describe('getOnCloseoptions', () => {
    it('should return all on-close options with correct labels and values', () => {
      const result = service.getOnCloseoptions();

      expect(result).toEqual([
        ['Power off the VM', 'power_off'],
        ['Send the shutdown signal (ACPI)', 'shutdown_signal'],
        ['Save the VM state', 'save_vm_state'],
      ]);
    });

    it.each([
      ['Power off the VM', 'power_off'],
      ['Send the shutdown signal (ACPI)', 'shutdown_signal'],
      ['Save the VM state', 'save_vm_state'],
    ])('should include option with label "%s" and value "%s"', (label, value) => {
      expect(service.getOnCloseoptions()).toContainEqual([label, value]);
    });
  });

  describe('getCategories', () => {
    it('should return all categories with correct labels and types', () => {
      const result = service.getCategories();

      expect(result).toEqual([
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
    ])('should include category with label "%s" and type "%s"', (label, type) => {
      expect(service.getCategories()).toContainEqual([label, type]);
    });
  });

  describe('getNetworkTypes', () => {
    it('should return all network types with correct values', () => {
      const result = service.getNetworkTypes();

      expect(result).toEqual(['default', 'e1000', 'e1000e', 'flexible', 'vlance', 'vmxnet', 'vmxnet2', 'vmxnet3']);
    });

    it.each(['default', 'e1000', 'e1000e', 'flexible', 'vlance', 'vmxnet', 'vmxnet2', 'vmxnet3'])(
      'should include network type: %s',
      (type) => {
        expect(service.getNetworkTypes()).toContain(type);
      },
    );
  });
});
