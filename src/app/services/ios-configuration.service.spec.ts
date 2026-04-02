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

  describe('getConsoleTypes', () => {
    it('should return telnet and none console types', () => {
      const result = service.getConsoleTypes();
      expect(result).toContain('telnet');
      expect(result).toContain('none');
    });

    it('should return exactly 2 console types', () => {
      expect(service.getConsoleTypes()).toHaveLength(2);
    });

    it('should return an array', () => {
      expect(Array.isArray(service.getConsoleTypes())).toBe(true);
    });
  });

  describe('getCategories', () => {
    it('should return 5 categories', () => {
      expect(service.getCategories()).toHaveLength(5);
    });

    it('should include Default category', () => {
      expect(service.getCategories()).toContainEqual(['Default', 'guest']);
    });

    it('should include Routers category', () => {
      expect(service.getCategories()).toContainEqual(['Routers', 'router']);
    });

    it('should return an array of tuples', () => {
      const result = service.getCategories();
      result.forEach((category) => {
        expect(Array.isArray(category)).toBe(true);
        expect(category).toHaveLength(2);
      });
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
      expect(Object.keys(service.getDefaultRamSettings())).toHaveLength(7);
    });

    it('should return an object with numeric values', () => {
      const result = service.getDefaultRamSettings();
      Object.values(result).forEach((value) => {
        expect(typeof value).toBe('number');
      });
    });

    it.each([
      ['c1700', 160],
      ['c2600', 160],
      ['c2691', 192],
      ['c3600', 192],
      ['c3725', 128],
      ['c3745', 256],
      ['c7200', 512],
    ])('should have %s RAM of %i MB', (platform, expectedRam) => {
      expect(service.getDefaultRamSettings()[platform]).toBe(expectedRam);
    });
  });

  describe('getDefaultNvRamSettings', () => {
    it('should return NVRAM settings for all platforms', () => {
      const result = service.getDefaultNvRamSettings();
      expect(result.c1700).toBe(128);
      expect(result.c2600).toBe(128);
      expect(result.c7200).toBe(512);
    });

    it('should have 7 platform entries', () => {
      expect(Object.keys(service.getDefaultNvRamSettings())).toHaveLength(7);
    });

    it.each([
      ['c1700', 128],
      ['c2600', 128],
      ['c2691', 256],
      ['c3600', 256],
      ['c3725', 256],
      ['c3745', 256],
      ['c7200', 512],
    ])('should have %s NVRAM of %i KB', (platform, expectedNvram) => {
      expect(service.getDefaultNvRamSettings()[platform]).toBe(expectedNvram);
    });
  });

  describe('getAvailablePlatforms', () => {
    it('should return 7 platforms', () => {
      expect(service.getAvailablePlatforms()).toHaveLength(7);
    });

    it('should include c1700 and c7200', () => {
      const result = service.getAvailablePlatforms();
      expect(result).toContain('c1700');
      expect(result).toContain('c7200');
    });

    it('should return all major platforms', () => {
      const expected = ['c1700', 'c2600', 'c2691', 'c3725', 'c3745', 'c3600', 'c7200'];
      expect(service.getAvailablePlatforms()).toEqual(expected);
    });
  });

  describe('getPlatformsWithEtherSwitchRouterOption', () => {
    it('should return object with boolean values', () => {
      const result = service.getPlatformsWithEtherSwitchRouterOption();
      Object.values(result).forEach((value) => {
        expect(typeof value).toBe('boolean');
      });
    });

    it('should have 7 platform entries', () => {
      expect(Object.keys(service.getPlatformsWithEtherSwitchRouterOption())).toHaveLength(7);
    });

    it.each([
      ['c1700', false],
      ['c2600', true],
      ['c2691', true],
      ['c3725', true],
      ['c3745', true],
      ['c3600', true],
      ['c7200', false],
    ])('platform %s should have ether switch router option: %s', (platform, expected) => {
      expect(service.getPlatformsWithEtherSwitchRouterOption()[platform]).toBe(expected);
    });
  });

  describe('getPlatformsWithChassis', () => {
    it('should have 7 platform entries', () => {
      expect(Object.keys(service.getPlatformsWithChassis())).toHaveLength(7);
    });

    it('should have c1700 and c2600 as true', () => {
      const result = service.getPlatformsWithChassis();
      expect(result.c1700).toBe(true);
      expect(result.c2600).toBe(true);
    });

    it('should have c2691 as false', () => {
      expect(service.getPlatformsWithChassis().c2691).toBe(false);
    });

    it.each([
      ['c1700', true],
      ['c2600', true],
      ['c2691', false],
      ['c3725', false],
      ['c3745', false],
      ['c3600', true],
      ['c7200', false],
    ])('platform %s should have chassis: %s', (platform, expected) => {
      expect(service.getPlatformsWithChassis()[platform]).toBe(expected);
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

    it('should have c2600 with 10 chassis options', () => {
      expect(service.getChassis().c2600).toHaveLength(10);
    });

    it('should have c3600 with 3 chassis options', () => {
      expect(service.getChassis().c3600).toHaveLength(3);
    });

    it('should return string arrays for each platform', () => {
      const result = service.getChassis();
      Object.values(result).forEach((chassisList) => {
        expect(Array.isArray(chassisList)).toBe(true);
        chassisList.forEach((chassis) => {
          expect(typeof chassis).toBe('string');
        });
      });
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

    it('should return all npe types', () => {
      const expected = ['npe-100', 'npe-150', 'npe-175', 'npe-200', 'npe-225', 'npe-300', 'npe-400', 'npe-g2'];
      expect(service.getNPETypes()).toEqual(expected);
    });
  });

  describe('getMidplaneTypes', () => {
    it('should return std and vxr', () => {
      const result = service.getMidplaneTypes();
      expect(result).toContain('std');
      expect(result).toContain('vxr');
    });

    it('should return exactly 2 midplane types', () => {
      expect(service.getMidplaneTypes()).toHaveLength(2);
    });
  });

  describe('getAdapterMatrix', () => {
    it('should return object with platform keys', () => {
      const result = service.getAdapterMatrix();
      expect(result.c1700).toBeDefined();
      expect(result.c7200).toBeDefined();
    });

    it('should have 7 platforms', () => {
      expect(Object.keys(service.getAdapterMatrix())).toHaveLength(7);
    });

    it('should have c1700 with chassis configurations', () => {
      const result = service.getAdapterMatrix();
      expect(result.c1700['1720']).toBeDefined();
      expect(result.c1700['1751']).toBeDefined();
    });

    it('should have c7200 with IO and PA slots', () => {
      const result = service.getAdapterMatrix();
      expect(result.c7200['']).toBeDefined();
      expect(result.c7200[''][0]).toBeDefined(); // IO slot
      expect(result.c7200[''][1]).toBeDefined(); // First PA slot
    });

    it('should return nested object structure', () => {
      const result = service.getAdapterMatrix();
      Object.keys(result).forEach((platform) => {
        expect(typeof result[platform]).toBe('object');
      });
    });
  });

  describe('getWicMatrix', () => {
    it('should return WIC matrix for all platforms', () => {
      const result = service.getWicMatrix();
      expect(result.c1700).toBeDefined();
      expect(result.c2600).toBeDefined();
    });

    it('should have 5 platforms in WIC matrix', () => {
      expect(Object.keys(service.getWicMatrix())).toHaveLength(5);
    });

    it('should have c1700 with 2 slots', () => {
      const result = service.getWicMatrix();
      expect(Object.keys(result.c1700)).toHaveLength(2);
    });

    it('should have c2600 with 3 slots', () => {
      const result = service.getWicMatrix();
      expect(Object.keys(result.c2600)).toHaveLength(3);
    });

    it('should return arrays for each slot', () => {
      const result = service.getWicMatrix();
      Object.values(result).forEach((platform) => {
        Object.values(platform).forEach((slot) => {
          expect(Array.isArray(slot)).toBe(true);
        });
      });
    });
  });

  describe('getIdlepcRegex', () => {
    it('should return a RegExp', () => {
      expect(service.getIdlepcRegex()).toBeInstanceOf(RegExp);
    });

    it('should match valid hex idlepc values', () => {
      const regex = service.getIdlepcRegex();
      expect(regex.test('0x1234abcd')).toBe(true);
      expect(regex.test('0xABCD1234')).toBe(true);
      expect(regex.test('0x0')).toBe(true);
    });

    it('should match empty string', () => {
      const regex = service.getIdlepcRegex();
      expect(regex.test('')).toBe(true);
    });

    it('should not match invalid hex values', () => {
      const regex = service.getIdlepcRegex();
      expect(regex.test('1234abcd')).toBe(false); // missing 0x prefix
      expect(regex.test('0xGGGGGGGG')).toBe(false); // invalid hex
    });
  });

  describe('getMacAddrRegex', () => {
    it('should return a RegExp', () => {
      expect(service.getMacAddrRegex()).toBeInstanceOf(RegExp);
    });

    it('should match valid MAC address formats', () => {
      const regex = service.getMacAddrRegex();
      expect(regex.test('1234.5678.90ab')).toBe(true);
      expect(regex.test('0000.0000.0000')).toBe(true);
      expect(regex.test('ABCD.EF01.2345')).toBe(true);
    });

    it('should match empty string', () => {
      const regex = service.getMacAddrRegex();
      expect(regex.test('')).toBe(true);
    });

    it('should not match invalid MAC address formats', () => {
      const regex = service.getMacAddrRegex();
      expect(regex.test('12345678')).toBe(false); // missing dots
      expect(regex.test('1234.5678.90ag')).toBe(false); // invalid char
      expect(regex.test('1234.5678.90')).toBe(false); // too short
    });
  });
});
