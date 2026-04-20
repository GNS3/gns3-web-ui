import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExternalSoftwareDefinitionService } from './external-software-definition.service';
import { PlatformService } from './platform.service';

vi.mock('environments/environment', () => ({
  environment: {
    solarputty_download_url: 'https://example.com/solarputty.exe',
  },
}));

describe('ExternalSoftwareDefinitionService', () => {
  let service: ExternalSoftwareDefinitionService;
  let mockPlatformService: any;

  beforeEach(() => {
    mockPlatformService = {
      isWindows: vi.fn(),
      isDarwin: vi.fn(),
      isLinux: vi.fn(),
    };

    service = new ExternalSoftwareDefinitionService(mockPlatformService);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of ExternalSoftwareDefinitionService', () => {
      expect(service).toBeInstanceOf(ExternalSoftwareDefinitionService);
    });
  });

  describe('get', () => {
    it('should return Windows software when on Windows', () => {
      mockPlatformService.isWindows.mockReturnValue(true);

      const result = service.get();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for Darwin', () => {
      mockPlatformService.isDarwin.mockReturnValue(true);

      const result = service.get();

      expect(result).toEqual([]);
    });

    it('should return empty array for Linux', () => {
      mockPlatformService.isLinux.mockReturnValue(true);

      const result = service.get();

      expect(result).toEqual([]);
    });

    it('should prioritize Windows check', () => {
      mockPlatformService.isWindows.mockReturnValue(true);
      mockPlatformService.isDarwin.mockReturnValue(true);

      const result = service.get();

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getForWindows', () => {
    beforeEach(() => {
      mockPlatformService.isWindows.mockReturnValue(false);
    });

    it('should return array with Wireshark', () => {
      const result = service.getForWindows();

      expect(result.some((s: any) => s.name === 'Wireshark')).toBe(true);
    });

    it('should include at least Wireshark', () => {
      const result = service.getForWindows();

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should have Wireshark properties', () => {
      const result = service.getForWindows();
      const wireshark = result.find((s: any) => s.name === 'Wireshark');

      expect(wireshark.type).toBe('web');
      expect(wireshark.binary).toBe('Wireshark.exe');
      expect(wireshark.sudo).toBe(true);
    });
  });

  describe('getForLinux', () => {
    it('should return empty array', () => {
      const result = service.getForLinux();

      expect(result).toEqual([]);
    });
  });

  describe('getForDarwin', () => {
    it('should return empty array', () => {
      const result = service.getForDarwin();

      expect(result).toEqual([]);
    });
  });
});
