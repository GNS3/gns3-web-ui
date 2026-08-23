import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Observable, of } from 'rxjs';
import { ServerSettingsService } from './server-settings.service';
import { HttpController } from './http-controller.service';
import { Controller } from '@models/controller';
import { ServerSettings, ServerSettingsUpdate } from '@models/server-settings/server-settings';

describe('ServerSettingsService', () => {
  let service: ServerSettingsService;
  let mockHttpController: any;
  let mockController: Controller;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHttpController = {
      get: vi.fn(),
      put: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ServerSettingsService,
        { provide: HttpController, useValue: mockHttpController },
      ],
    });
    service = TestBed.inject(ServerSettingsService);

    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      tokenExpired: false,
    } as Controller;
  });

  describe('getServerSettings', () => {
    it('should request the settings endpoint without a version prefix', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getServerSettings(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/settings');
    });

    it('should return an Observable of ServerSettings', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.getServerSettings(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('updateServerSettings', () => {
    it('should send a partial update via PUT to the settings endpoint', () => {
      const update: ServerSettingsUpdate = {
        Server: { report_errors: true },
        Qemu: { enable_monitor: false },
      };
      mockHttpController.put.mockReturnValue(of({}));

      service.updateServerSettings(mockController, update);

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/settings', update);
    });

    it('should pass the payload object through untouched', () => {
      const update: ServerSettingsUpdate = { Server: { port: null } };
      mockHttpController.put.mockReturnValue(of({}));

      service.updateServerSettings(mockController, update);

      expect(mockHttpController.put.mock.calls[0][2]).toBe(update);
    });

    it('should return an Observable of the update response', () => {
      const response = { Server: {} as ServerSettings['Server'], restart_required: ['Server.port'] };
      mockHttpController.put.mockReturnValue(of(response));

      const result = service.updateServerSettings(mockController, {});

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
