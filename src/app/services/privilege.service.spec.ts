import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivilegeService } from './privilege.service';
import { HttpController } from './http-controller.service';
import { Observable, of, throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
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
    it('should call httpController.get with correct endpoint and return privileges', async () => {
      const mockPrivileges: Privilege[] = [{ name: 'read' } as Privilege, { name: 'write' } as Privilege];
      mockHttpController.get.mockReturnValue(of(mockPrivileges));

      const privileges = await firstValueFrom(service.get(mockController));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/privileges');
      expect(privileges).toEqual(mockPrivileges);
    });

    it.each([
      { privileges: ([] as Privilege[]), description: 'empty list' },
      { privileges: [{ name: 'read' } as Privilege], description: 'single privilege' },
      { privileges: [{ name: 'read' } as Privilege, { name: 'write' } as Privilege, { name: 'admin' } as Privilege], description: 'multiple privileges' },
    ])('should return $description', async ({ privileges }) => {
      mockHttpController.get.mockReturnValue(of(privileges));

      const result = await firstValueFrom(service.get(mockController));

      expect(result).toEqual(privileges);
    });

    it('should propagate error from httpController.get', async () => {
      const error = new Error('Server error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.get(mockController))).rejects.toThrow('Server error');
    });

    it('should pass controller to httpController.get', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.get(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/privileges');
    });

    it('should return Observable of Privilege array', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.get(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
