import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VersionService } from './version.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
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
    it('should call httpController.get with correct endpoint', () => {
      const mockVersion: Version = { version: '3.1.0' } as Version;
      mockHttpController.get.mockReturnValue(of(mockVersion));

      service.get(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/version');
    });

    it('should return Observable of Version', () => {
      const mockVersion: Version = { version: '3.0.0' } as Version;
      mockHttpController.get.mockReturnValue(of(mockVersion));

      const result = service.get(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle version response', async () => {
      const mockVersion: Version = { version: '3.1.0' } as Version;
      mockHttpController.get.mockReturnValue(of(mockVersion));

      const result = await new Promise((resolve) => {
        service.get(mockController).subscribe((data) => resolve(data));
      });

      expect(result).toEqual(mockVersion);
    });

    it('should pass controller to httpController.get', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.get(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/version');
    });
  });
});
