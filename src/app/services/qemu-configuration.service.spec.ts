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
    let platforms: string[];

    beforeEach(() => {
      platforms = service.getPlatform();
    });

    it('should return an array', () => {
      expect(platforms).toBeInstanceOf(Array);
    });

    it.each(['x86_64', 'aarch64', 'i386', 'ppc64', 's390x'])('should include %s platform', (platform) => {
      expect(platforms).toContain(platform);
    });

    it('should return 28 platform options', () => {
      expect(platforms).toHaveLength(28);
    });
  });

  describe('getConsoleTypes', () => {
    let consoleTypes: string[];

    beforeEach(() => {
      consoleTypes = service.getConsoleTypes();
    });

    it('should return 5 console types', () => {
      expect(consoleTypes).toHaveLength(5);
    });

    it('should include telnet, vnc, spice, spice+agent, none', () => {
      expect(consoleTypes).toEqual(['telnet', 'vnc', 'spice', 'spice+agent', 'none']);
    });
  });

  describe('getAuxConsoleTypes', () => {
    let auxConsoleTypes: string[];

    beforeEach(() => {
      auxConsoleTypes = service.getAuxConsoleTypes();
    });

    it('should return 2 aux console types', () => {
      expect(auxConsoleTypes).toHaveLength(2);
    });

    it('should include telnet and none', () => {
      expect(auxConsoleTypes).toContain('telnet');
      expect(auxConsoleTypes).toContain('none');
    });
  });

  describe('getDiskInterfaces', () => {
    let diskInterfaces: string[];

    beforeEach(() => {
      diskInterfaces = service.getDiskInterfaces();
    });

    it('should return 10 disk interfaces', () => {
      expect(diskInterfaces).toHaveLength(10);
    });

    it.each(['virtio', 'ide', 'scsi', 'sata', 'nvme'])('should include %s interface', (interfaceType) => {
      expect(diskInterfaces).toContain(interfaceType);
    });
  });

  describe('getNetworkTypes', () => {
    let networkTypes: { value: string; name: string }[];

    beforeEach(() => {
      networkTypes = service.getNetworkTypes();
    });

    it('should return an array of network type objects', () => {
      expect(networkTypes).toBeInstanceOf(Array);
    });

    it('should have objects with value and name properties', () => {
      expect(networkTypes[0]).toHaveProperty('value');
      expect(networkTypes[0]).toHaveProperty('name');
    });

    it.each(['e1000', 'virtio', 'pcnet', 'ne2k_pci', 'rtl8139'])('should include %s network type', (type) => {
      expect(networkTypes.find((n) => n.value === type)).toBeDefined();
    });
  });

  describe('getBootPriorities', () => {
    let bootPriorities: string[][];

    beforeEach(() => {
      bootPriorities = service.getBootPriorities();
    });

    it('should return 5 boot priorities', () => {
      expect(bootPriorities).toHaveLength(5);
    });

    it.each([
      { label: 'HDD', value: 'c' },
      { label: 'Network', value: 'n' },
      { label: 'CD/DVD-ROM', value: 'd' },
    ])('should include $label boot option', ({ label, value }) => {
      expect(bootPriorities).toContainEqual([label, value]);
    });
  });

  describe('getOnCloseOptions', () => {
    let onCloseOptions: string[][];

    beforeEach(() => {
      onCloseOptions = service.getOnCloseOptions();
    });

    it('should return 3 on close options', () => {
      expect(onCloseOptions).toHaveLength(3);
    });

    it.each([
      { label: 'Power off the VM', value: 'power_off' },
      { label: 'Save the VM state', value: 'save_vm_state' },
      { label: 'Send the shutdown signal (ACPI)', value: 'shutdown_signal' },
    ])('should include $label option', ({ label, value }) => {
      expect(onCloseOptions).toContainEqual([label, value]);
    });
  });

  describe('getCategories', () => {
    let categories: string[][];

    beforeEach(() => {
      categories = service.getCategories();
    });

    it('should return 5 categories', () => {
      expect(categories).toHaveLength(5);
    });

    it.each([
      { label: 'Default', value: 'guest' },
      { label: 'Routers', value: 'router' },
      { label: 'Switches', value: 'switch' },
      { label: 'End devices', value: 'guest' },
    ])('should include $label category', ({ label, value }) => {
      expect(categories).toContainEqual([label, value]);
    });
  });

  describe('getPriorities', () => {
    let priorities: string[];

    beforeEach(() => {
      priorities = service.getPriorities();
    });

    it('should return 6 priority levels', () => {
      expect(priorities).toHaveLength(6);
    });

    it.each(['realtime', 'very high', 'high', 'normal', 'low', 'very low'])(
      'should include %s priority',
      (priority) => {
        expect(priorities).toContain(priority);
      }
    );
  });

  describe('getMacAddrRegex', () => {
    let regex: RegExp;

    beforeEach(() => {
      regex = service.getMacAddrRegex();
    });

    it('should return a RegExp', () => {
      expect(regex).toBeInstanceOf(RegExp);
    });

    it.each([
      { mac: '00:00:00:00:00:00', valid: true },
      { mac: 'AA:BB:CC:DD:EE:FF', valid: true },
      { mac: '00:00:5E:00:53:AF', valid: true },
      { mac: '00:00:00:00:00', valid: false },
      { mac: '1234567890ab', valid: false },
      { mac: 'GG:HH:II:JJ:KK:LL', valid: false },
      { mac: '00-00-00-00-00-00', valid: false },
      { mac: '00:00:00:00:00:00:00', valid: false },
    ])('should return $valid for MAC: $mac', ({ mac, valid }) => {
      expect(regex.test(mac)).toBe(valid);
    });
  });
});
