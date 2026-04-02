import { describe, it, expect, beforeEach } from 'vitest';
import { QemuConfigurationService } from './qemu-configuration.service';

describe('QemuConfigurationService', () => {
  let service: QemuConfigurationService;

  beforeEach(() => {
    service = new QemuConfigurationService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of QemuConfigurationService', () => {
      expect(service).toBeInstanceOf(QemuConfigurationService);
    });
  });

  describe('getPlatform', () => {
    it('should return array of platforms', () => {
      const result = service.getPlatform();
      expect(result).toBeInstanceOf(Array);
    });

    it('should include x86_64', () => {
      expect(service.getPlatform()).toContain('x86_64');
    });

    it('should include aarch64', () => {
      expect(service.getPlatform()).toContain('aarch64');
    });

    it('should have 28 platform options', () => {
      expect(service.getPlatform()).toHaveLength(28);
    });
  });

  describe('getConsoleTypes', () => {
    it('should return 5 console types', () => {
      const result = service.getConsoleTypes();
      expect(result).toHaveLength(5);
    });

    it('should include telnet, vnc, spice', () => {
      const result = service.getConsoleTypes();
      expect(result).toContain('telnet');
      expect(result).toContain('vnc');
      expect(result).toContain('spice');
    });
  });

  describe('getAuxConsoleTypes', () => {
    it('should return 2 aux console types', () => {
      const result = service.getAuxConsoleTypes();
      expect(result).toHaveLength(2);
    });

    it('should include telnet and none', () => {
      const result = service.getAuxConsoleTypes();
      expect(result).toContain('telnet');
      expect(result).toContain('none');
    });
  });

  describe('getDiskInterfaces', () => {
    it('should return 10 disk interfaces', () => {
      expect(service.getDiskInterfaces()).toHaveLength(10);
    });

    it('should include virtio and ide', () => {
      const result = service.getDiskInterfaces();
      expect(result).toContain('virtio');
      expect(result).toContain('ide');
    });
  });

  describe('getNetworkTypes', () => {
    it('should return array of network type objects', () => {
      const result = service.getNetworkTypes();
      expect(result).toBeInstanceOf(Array);
    });

    it('should have objects with value and name', () => {
      const result = service.getNetworkTypes();
      expect(result[0]).toHaveProperty('value');
      expect(result[0]).toHaveProperty('name');
    });

    it('should include e1000 network type', () => {
      const result = service.getNetworkTypes();
      expect(result.find((n) => n.value === 'e1000')).toBeDefined();
    });

    it('should include virtio network type', () => {
      const result = service.getNetworkTypes();
      expect(result.find((n) => n.value === 'virtio')).toBeDefined();
    });
  });

  describe('getBootPriorities', () => {
    it('should return 5 boot priorities', () => {
      const result = service.getBootPriorities();
      expect(result).toHaveLength(5);
    });

    it('should include HDD boot option', () => {
      expect(service.getBootPriorities()).toContainEqual(['HDD', 'c']);
    });

    it('should include Network boot option', () => {
      expect(service.getBootPriorities()).toContainEqual(['Network', 'n']);
    });
  });

  describe('getOnCloseOptions', () => {
    it('should return 3 on close options', () => {
      const result = service.getOnCloseOptions();
      expect(result).toHaveLength(3);
    });

    it('should include power_off option', () => {
      expect(service.getOnCloseOptions()).toContainEqual(['Power off the VM', 'power_off']);
    });

    it('should include save_vm_state option', () => {
      expect(service.getOnCloseOptions()).toContainEqual(['Save the VM state', 'save_vm_state']);
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

  describe('getPriorities', () => {
    it('should return 6 priority levels', () => {
      const result = service.getPriorities();
      expect(result).toHaveLength(6);
    });

    it('should include realtime and high', () => {
      const result = service.getPriorities();
      expect(result).toContain('realtime');
      expect(result).toContain('high');
    });
  });

  describe('getMacAddrRegex', () => {
    it('should return a RegExp', () => {
      expect(service.getMacAddrRegex()).toBeInstanceOf(RegExp);
    });

    it('should match valid MAC addresses', () => {
      const regex = service.getMacAddrRegex();
      expect(regex.test('00:00:00:00:00:00')).toBe(true);
      expect(regex.test('AA:BB:CC:DD:EE:FF')).toBe(true);
    });

    it('should not match invalid MAC addresses', () => {
      const regex = service.getMacAddrRegex();
      expect(regex.test('00:00:00:00:00')).toBe(false);
      expect(regex.test('1234567890ab')).toBe(false);
    });
  });
});
