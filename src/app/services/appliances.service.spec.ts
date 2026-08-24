import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApplianceService } from './appliances.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { Appliance } from '@models/appliance';

vi.mock('environments/environment', () => ({
  environment: {
    current_version: '3.0.0',
  },
}));

describe('ApplianceService', () => {
  let service: ApplianceService;
  let mockHttpController: any;
  let mockController: Controller;

  beforeEach(() => {
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
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

    service = new ApplianceService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of ApplianceService', () => {
      expect(service).toBeInstanceOf(ApplianceService);
    });
  });

  describe('getAppliances', () => {
    it('should call httpController.get with /appliances endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getAppliances(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/appliances');
    });

    it('should return Observable of Appliance array', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getAppliances(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getAppliance', () => {
    it('should call httpController.get with provided URL', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getAppliance(mockController, '/appliances/test');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/appliances/test');
    });

    it('should return Observable of Appliance', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.getAppliance(mockController, '/appliances/test');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getUploadPath', () => {
    it('should return correct URL for upload', () => {
      const result = service.getUploadPath(mockController, 'appliance.img');

      expect(result).toContain('http://');
      expect(result).toContain('localhost:3080');
      expect(result).toContain('appliance.img');
    });

    it('should include version in path', () => {
      const result = service.getUploadPath(mockController, 'image.bin');

      expect(result).toContain('/v3/');
    });
  });

  describe('updateAppliances', () => {
    it('should call httpController.get with update query', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.updateAppliances(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/appliances?update=yes');
    });

    it('should return Observable of Appliance array', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.updateAppliances(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should normalize v8 appliances like getAppliances does', () => {
      const v8Appliance = {
        name: 'v8 Appliance',
        category: 'router',
        settings: [
          {
            name: 'Default',
            default: true,
            template_type: 'qemu',
            template_properties: { ram: 2048, adapters: 2 },
          },
        ],
      } as unknown as Appliance;
      mockHttpController.get.mockReturnValue(of([v8Appliance]));

      const emitted: Appliance[] = [];
      service.updateAppliances(mockController).subscribe((appliances) => emitted.push(...appliances));

      expect(emitted[0].qemu).toEqual({ ram: 2048, adapters: 2 });
    });

    it('should tolerate a null response', () => {
      mockHttpController.get.mockReturnValue(of(null));

      const emitted: Appliance[] = [];
      service.updateAppliances(mockController).subscribe((appliances) => emitted.push(...appliances));

      expect(emitted).toEqual([]);
    });
  });
});
