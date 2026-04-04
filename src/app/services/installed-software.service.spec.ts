import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstalledSoftwareService } from './installed-software.service';
import { ExternalSoftwareDefinitionService } from './external-software-definition.service';

describe('InstalledSoftwareService', () => {
  let service: InstalledSoftwareService;
  let mockExternalSoftwareDefinition: any;

  beforeEach(() => {
    mockExternalSoftwareDefinition = {
      get: vi.fn(),
    };

    service = new InstalledSoftwareService(mockExternalSoftwareDefinition);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of InstalledSoftwareService', () => {
      expect(service).toBeInstanceOf(InstalledSoftwareService);
    });
  });

  describe('list', () => {
    it('should call externalSoftwareDefinition.get()', () => {
      mockExternalSoftwareDefinition.get.mockReturnValue([]);

      service.list();

      expect(mockExternalSoftwareDefinition.get).toHaveBeenCalled();
    });

    it('should return software with installed=false', () => {
      const mockSoftware = [
        { name: 'Wireshark', installed: true },
        { name: 'SolarPuTTY', installed: true },
      ];
      mockExternalSoftwareDefinition.get.mockReturnValue(mockSoftware);

      const result = service.list();

      expect(result[0].installed).toBe(false);
      expect(result[1].installed).toBe(false);
    });

    it('should return empty array when no software defined', () => {
      mockExternalSoftwareDefinition.get.mockReturnValue([]);

      const result = service.list();

      expect(result).toEqual([]);
    });

    it('should preserve other software properties', () => {
      const mockSoftware = [{ name: 'Wireshark', type: 'web', installed: true }];
      mockExternalSoftwareDefinition.get.mockReturnValue(mockSoftware);

      const result = service.list();

      expect(result[0].name).toBe('Wireshark');
      expect(result[0].type).toBe('web');
    });

    it('should modify objects in place (service behavior)', () => {
      const mockSoftware = [{ name: 'Wireshark', installed: true }];
      mockExternalSoftwareDefinition.get.mockReturnValue(mockSoftware);

      service.list();

      // The service modifies the object directly
      expect(mockSoftware[0].installed).toBe(false);
    });

    it('should handle multiple software items', () => {
      const mockSoftware = [
        { name: 'Software1', installed: true },
        { name: 'Software2', installed: false },
        { name: 'Software3', installed: true },
      ];
      mockExternalSoftwareDefinition.get.mockReturnValue(mockSoftware);

      const result = service.list();

      expect(result).toHaveLength(3);
      expect(result.every((s) => s.installed === false)).toBe(true);
    });
  });
});
