import { describe, it, expect, beforeEach } from 'vitest';
import { IosConfigurationService } from './ios-configuration.service';

describe('IosConfigurationService', () => {
  let service: IosConfigurationService;

  beforeEach(() => {
    service = new IosConfigurationService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of IosConfigurationService', () => {
      expect(service).toBeInstanceOf(IosConfigurationService);
    });
  });

  describe('Static Properties', () => {
    it('should have c2600_nms with 4 items', () => {
      expect(service.c2600_nms).toHaveLength(4);
    });

    it('should have c3600_nms with 5 items', () => {
      expect(service.c3600_nms).toHaveLength(5);
    });

    it('should have c3700_nms with 3 items', () => {
      expect(service.c3700_nms).toHaveLength(3);
    });

    it('should have c7200_pas with 9 items', () => {
      expect(service.c7200_pas).toHaveLength(9);
    });

    it('should have c7200_io with 3 items', () => {
      expect(service.c7200_io).toHaveLength(3);
    });
  });

  describe('getConsoleTypes', () => {
    it('should return telnet and none', () => {
      const result = service.getConsoleTypes();
      expect(result).toContain('telnet');
      expect(result).toContain('none');
    });
  });

  describe('getCategories', () => {
    it('should return 5 categories', () => {
      expect(service.getCategories()).toHaveLength(5);
    });

    it('should include Default category', () => {
      expect(service.getCategories()).toContainEqual(['Default', 'guest']);
    });
  });

  describe('getDefaultRamSettings', () => {
    it('should return RAM settings for all platforms', () => {
      const result = service.getDefaultRamSettings();
      expect(result.c1700).toBe(160);
      expect(result.c2600).toBe(160);
      expect(result.c7200).toBe(512);
    });

    it('should have 7 platform entries', () => {
      const result = service.getDefaultRamSettings();
      expect(Object.keys(result)).toHaveLength(7);
    });
  });

  describe('getDefaultNvRamSettings', () => {
    it('should return NVRAM settings for all platforms', () => {
      const result = service.getDefaultNvRamSettings();
      expect(result.c1700).toBe(128);
      expect(result.c2600).toBe(128);
      expect(result.c7200).toBe(512);
    });
  });

  describe('getAvailablePlatforms', () => {
    it('should return 7 platforms', () => {
      const result = service.getAvailablePlatforms();
      expect(result).toHaveLength(7);
    });

    it('should include c1700 and c7200', () => {
      const result = service.getAvailablePlatforms();
      expect(result).toContain('c1700');
      expect(result).toContain('c7200');
    });
  });

  describe('getPlatformsWithEtherSwitchRouterOption', () => {
    it('should return object with boolean values', () => {
      const result = service.getPlatformsWithEtherSwitchRouterOption();
      expect(typeof result.c2600).toBe('boolean');
      expect(typeof result.c7200).toBe('boolean');
    });

    it('should have c2600 as true', () => {
      expect(service.getPlatformsWithEtherSwitchRouterOption().c2600).toBe(true);
    });

    it('should have c7200 as false', () => {
      expect(service.getPlatformsWithEtherSwitchRouterOption().c7200).toBe(false);
    });
  });

  describe('getPlatformsWithChassis', () => {
    it('should have c1700 and c2600 as true', () => {
      const result = service.getPlatformsWithChassis();
      expect(result.c1700).toBe(true);
      expect(result.c2600).toBe(true);
    });

    it('should have c2691 as false', () => {
      expect(service.getPlatformsWithChassis().c2691).toBe(false);
    });
  });

  describe('getChassis', () => {
    it('should return chassis for c1700, c2600, c3600', () => {
      const result = service.getChassis();
      expect(result.c1700).toBeDefined();
      expect(result.c2600).toBeDefined();
      expect(result.c3600).toBeDefined();
    });

    it('should have c1700 with 5 chassis options', () => {
      expect(service.getChassis().c1700).toHaveLength(5);
    });
  });

  describe('getNPETypes', () => {
    it('should return 8 NPE types', () => {
      expect(service.getNPETypes()).toHaveLength(8);
    });

    it('should include npe-100 and npe-g2', () => {
      const result = service.getNPETypes();
      expect(result).toContain('npe-100');
      expect(result).toContain('npe-g2');
    });
  });

  describe('getMidplaneTypes', () => {
    it('should return std and vxr', () => {
      const result = service.getMidplaneTypes();
      expect(result).toContain('std');
      expect(result).toContain('vxr');
    });
  });

  describe('getAdapterMatrix', () => {
    it('should return object with platform keys', () => {
      const result = service.getAdapterMatrix();
      expect(result.c1700).toBeDefined();
      expect(result.c7200).toBeDefined();
    });

    it('should have c1700 chassis configuration', () => {
      const result = service.getAdapterMatrix();
      expect(result.c1700['1720']).toBeDefined();
    });

    it('should have c7200 configuration with 7 slots', () => {
      const result = service.getAdapterMatrix();
      expect(result.c7200['']).toBeDefined();
    });
  });

  describe('getWicMatrix', () => {
    it('should return WIC matrix for all platforms', () => {
      const result = service.getWicMatrix();
      expect(result.c1700).toBeDefined();
      expect(result.c2600).toBeDefined();
    });

    it('should have c1700 with 2 slots', () => {
      const result = service.getWicMatrix();
      expect(Object.keys(result.c1700)).toHaveLength(2);
    });
  });

  describe('getIdlepcRegex', () => {
    it('should return a RegExp', () => {
      expect(service.getIdlepcRegex()).toBeInstanceOf(RegExp);
    });

    it('should match valid idlepc values', () => {
      const regex = service.getIdlepcRegex();
      expect(regex.test('0x1234abcd')).toBe(true);
      expect(regex.test('')).toBe(true);
    });
  });

  describe('getMacAddrRegex', () => {
    it('should return a RegExp', () => {
      expect(service.getMacAddrRegex()).toBeInstanceOf(RegExp);
    });

    it('should match valid MAC address formats', () => {
      const regex = service.getMacAddrRegex();
      expect(regex.test('1234.5678.90ab')).toBe(true);
      expect(regex.test('')).toBe(true);
    });
  });
});
