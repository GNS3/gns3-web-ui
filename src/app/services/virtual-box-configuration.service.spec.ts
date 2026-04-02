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
    it('should return telnet and none with correct length', () => {
      const result = service.getConsoleTypes();
      expect(result).toEqual(['telnet', 'none']);
      expect(result).toHaveLength(2);
    });

    it('should not return null or undefined', () => {
      const result = service.getConsoleTypes();
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('getOnCloseoptions', () => {
    it('should return 3 on close options', () => {
      const result = service.getOnCloseoptions();
      expect(result).toHaveLength(3);
    });

    it('should include power_off option', () => {
      const result = service.getOnCloseoptions();
      expect(result).toContainEqual(['Power off the VM', 'power_off']);
    });

    it('should include shutdown_signal option', () => {
      const result = service.getOnCloseoptions();
      expect(result).toContainEqual(['Send the shutdown signal (ACPI)', 'shutdown_signal']);
    });

    it('should include save_vm_state option', () => {
      const result = service.getOnCloseoptions();
      expect(result).toContainEqual(['Save the VM state', 'save_vm_state']);
    });

    it('should not be affected by mutation', () => {
      const result = service.getOnCloseoptions();
      result.pop();
      const secondCall = service.getOnCloseoptions();
      expect(secondCall).toHaveLength(3);
    });
  });

  describe('getCategories', () => {
    it('should return 5 categories', () => {
      const result = service.getCategories();
      expect(result).toHaveLength(5);
    });

    it('should include Default category', () => {
      const result = service.getCategories();
      expect(result).toContainEqual(['Default', 'guest']);
    });

    it('should include Routers category', () => {
      const result = service.getCategories();
      expect(result).toContainEqual(['Routers', 'router']);
    });

    it('should include Switches category', () => {
      const result = service.getCategories();
      expect(result).toContainEqual(['Switches', 'switch']);
    });

    it('should include End devices category', () => {
      const result = service.getCategories();
      expect(result).toContainEqual(['End devices', 'guest']);
    });

    it('should include Security devices category', () => {
      const result = service.getCategories();
      expect(result).toContainEqual(['Security devices', 'firewall']);
    });

    it('should not return null or undefined', () => {
      const result = service.getCategories();
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('getNetworkTypes', () => {
    it('should return 6 network types', () => {
      const result = service.getNetworkTypes();
      expect(result).toHaveLength(6);
    });

    it('should include PCnet-PCI II network type', () => {
      const result = service.getNetworkTypes();
      expect(result).toContain('PCnet-PCI II (Am79C970A)');
    });

    it('should include PCNet-FAST III network type', () => {
      const result = service.getNetworkTypes();
      expect(result).toContain('PCNet-FAST III (Am79C973)');
    });

    it('should include Intel PRO/1000 network types', () => {
      const result = service.getNetworkTypes();
      expect(result.filter((n) => n.includes('Intel PRO/1000'))).toHaveLength(3);
    });

    it('should include virtio network type', () => {
      const result = service.getNetworkTypes();
      expect(result.some((n) => n.includes('virtio'))).toBe(true);
    });

    it('should include paravirtualized network type description', () => {
      const result = service.getNetworkTypes();
      expect(result).toContain('Paravirtualized Network (virtio-net)');
    });

    it('should not return null or undefined', () => {
      const result = service.getNetworkTypes();
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Array);
    });
  });
});
