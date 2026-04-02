import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ControllerSettingsService } from './controller-settings.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { ControllerSettings } from '@models/controllerSettings';
import { QemuSettings } from '@models/settings/qemu-settings';

describe('ControllerSettingsService', () => {
  let service: ControllerSettingsService;
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

    service = new ControllerSettingsService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of ControllerSettingsService', () => {
      expect(service).toBeInstanceOf(ControllerSettingsService);
    });
  });

  describe('get', () => {
    it('should call httpController.get with /settings endpoint', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.get(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/settings');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.get(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('update', () => {
    it('should call httpController.post with /settings endpoint', () => {
      const settings: ControllerSettings = { console_server_password: 'pass' } as ControllerSettings;
      mockHttpController.post.mockReturnValue(of(settings));

      service.update(mockController, settings);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/settings', settings);
    });

    it('should return Observable', () => {
      const settings: ControllerSettings = {} as ControllerSettings;
      mockHttpController.post.mockReturnValue(of(settings));

      const result = service.update(mockController, settings);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getSettingsForQemu', () => {
    it('should call httpController.get with /settings/qemu endpoint', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getSettingsForQemu(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/settings/qemu');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.getSettingsForQemu(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('updateSettingsForQemu', () => {
    it('should call httpController.put with /settings/qemu endpoint', () => {
      const qemuSettings: QemuSettings = {
        enable_hardware_acceleration: true,
        require_hardware_acceleration: false,
      } as QemuSettings;
      mockHttpController.put.mockReturnValue(of(qemuSettings));

      service.updateSettingsForQemu(mockController, qemuSettings);

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/settings/qemu', {
        enable_hardware_acceleration: true,
        require_hardware_acceleration: false,
      });
    });

    it('should return Observable', () => {
      const qemuSettings: QemuSettings = {
        enable_hardware_acceleration: true,
        require_hardware_acceleration: false,
      } as QemuSettings;
      mockHttpController.put.mockReturnValue(of(qemuSettings));

      const result = service.updateSettingsForQemu(mockController, qemuSettings);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
