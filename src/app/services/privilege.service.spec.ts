import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivilegeService } from './privilege.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { Privilege } from '@models/api/Privilege';

describe('PrivilegeService', () => {
  let service: PrivilegeService;
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

    service = new PrivilegeService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of PrivilegeService', () => {
      expect(service).toBeInstanceOf(PrivilegeService);
    });
  });

  describe('get', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockPrivileges: Privilege[] = [
        { name: 'read' } as Privilege,
        { name: 'write' } as Privilege,
      ];
      mockHttpController.get.mockReturnValue(of(mockPrivileges));

      service.get(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/privileges');
    });

    it('should return Observable of Privilege array', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.get(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty privileges list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.get(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should pass controller to httpController.get', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.get(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/privileges');
    });
  });
});
