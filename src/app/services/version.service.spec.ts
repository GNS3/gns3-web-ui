import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VersionService } from './version.service';
import { HttpController } from './http-controller.service';
import { of, throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Controller } from '@models/controller';
import { Version } from '@models/version';

describe('VersionService', () => {
  let service: VersionService;
  let mockHttpController: any;
  let mockController: Controller;

  beforeEach(() => {
    mockHttpController = {
      get: vi.fn(),
    };

    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      status: 'running',
    } as Controller;

    service = new VersionService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of VersionService', () => {
      expect(service).toBeInstanceOf(VersionService);
    });
  });

  describe('get', () => {
    it('should call httpController.get with correct endpoint and controller', () => {
      const mockVersion: Version = { version: '3.1.0' } as Version;
      mockHttpController.get.mockReturnValue(of(mockVersion));

      service.get(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/version');
    });

    it('should return Version with correct version string', async () => {
      const mockVersion: Version = { version: '3.1.0' } as Version;
      mockHttpController.get.mockReturnValue(of(mockVersion));

      const result = await firstValueFrom(service.get(mockController));

      expect(result.version).toBe('3.1.0');
    });

    it('should propagate error from httpController.get', async () => {
      const error = new Error('Network error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.get(mockController))).rejects.toThrow('Network error');
    });

    it('should handle version response with empty object', async () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = await firstValueFrom(service.get(mockController));

      expect(result).toEqual({});
    });

    it('should handle version response with different version formats', async () => {
      const testCases = [
        { version: '3.0.0' },
        { version: '2.5.1' },
        { version: '1.0.0-beta' },
      ];

      for (const mockVersion of testCases) {
        mockHttpController.get.mockReturnValue(of(mockVersion));

        const result = await firstValueFrom(service.get(mockController));

        expect(result.version).toBe(mockVersion.version);
      }
    });
  });
});
