import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoleService } from './role.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { Role } from '@models/api/role';
import { Privilege } from '@models/api/Privilege';

describe('RoleService', () => {
  let service: RoleService;
  let mockHttpController: any;
  let mockController: Controller;

  beforeEach(() => {
    // Mock HttpController
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    // Mock Controller
    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    service = new RoleService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of RoleService', () => {
      expect(service).toBeInstanceOf(RoleService);
    });
  });

  describe('get', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockRoles: Role[] = [
        { role_id: 'role-1', name: 'Admin', description: 'Administrator' } as Role,
        { role_id: 'role-2', name: 'User', description: 'Regular user' } as Role,
      ];

      mockHttpController.get.mockReturnValue(of(mockRoles));

      service.get(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/roles');
    });

    it('should return Observable of Role array', () => {
      const mockRoles: Role[] = [];
      mockHttpController.get.mockReturnValue(of(mockRoles));

      const result = service.get(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty roles list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.get(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'role-123');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role-123'
      );
    });

    it('should return Observable', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.delete(mockController, 'role-123');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include role_id in URL', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'role-to-delete');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role-to-delete'
      );
    });
  });

  describe('create', () => {
    it('should call httpController.post with correct endpoint and payload', () => {
      mockHttpController.post.mockReturnValue(of({}));

      const newRole = { name: 'New Role', description: 'New role description' };

      service.create(mockController, newRole);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/access/roles',
        newRole
      );
    });

    it('should return Observable', () => {
      mockHttpController.post.mockReturnValue(of({}));

      const result = service.create(mockController, { name: 'Test', description: 'Desc' });

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getById', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockRole: Role = { role_id: 'role-1', name: 'Admin', description: 'Admin role' } as Role;

      mockHttpController.get.mockReturnValue(of(mockRole));

      service.getById(mockController, 'role-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role-1'
      );
    });

    it('should return Observable of Role', () => {
      const mockRole: Role = { role_id: 'role-1', name: 'Admin' } as Role;
      mockHttpController.get.mockReturnValue(of(mockRole));

      const result = service.getById(mockController, 'role-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('update', () => {
    it('should call httpController.put with correct endpoint and payload', () => {
      const mockRole: Role = {
        role_id: 'role-1',
        name: 'Updated Role',
        description: 'Updated description',
      } as Role;

      mockHttpController.put.mockReturnValue(of(mockRole));

      service.update(mockController, mockRole);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role-1',
        { name: 'Updated Role', description: 'Updated description' }
      );
    });

    it('should return Observable', () => {
      const mockRole: Role = { role_id: 'role-1', name: 'Test', description: 'Desc' } as Role;
      mockHttpController.put.mockReturnValue(of(mockRole));

      const result = service.update(mockController, mockRole);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should pass role properties in payload', () => {
      const mockRole: Role = {
        role_id: 'role-2',
        name: 'Role Name',
        description: 'Role Description',
      } as Role;

      mockHttpController.put.mockReturnValue(of(mockRole));

      service.update(mockController, mockRole);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.name).toBe('Role Name');
      expect(payload.description).toBe('Role Description');
    });
  });

  describe('setPrivileges', () => {
    it('should call httpController.put with correct endpoint', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.setPrivileges(mockController, 'role-1', 'priv-1');

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role-1/privileges/priv-1',
        undefined
      );
    });

    it('should pass undefined as body', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.setPrivileges(mockController, 'role-1', 'priv-1');

      const putCall = mockHttpController.put.mock.calls[0];
      expect(putCall[2]).toBeUndefined();
    });

    it('should return Observable', () => {
      mockHttpController.put.mockReturnValue(of({}));

      const result = service.setPrivileges(mockController, 'role-1', 'priv-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('removePrivileges', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.removePrivileges(mockController, 'role-1', 'priv-1');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role-1/privileges/priv-1'
      );
    });

    it('should return Observable', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.removePrivileges(mockController, 'role-1', 'priv-1');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include role_id and privilege_id in URL', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.removePrivileges(mockController, 'role-to-update', 'priv-to-remove');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role-to-update/privileges/priv-to-remove'
      );
    });
  });

  describe('URL Construction', () => {
    it('should construct correct URL for different role IDs', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getById(mockController, 'role-alpha');
      service.getById(mockController, 'role-beta');
      service.getById(mockController, 'role-gamma');

      expect(mockHttpController.get).toHaveBeenCalledTimes(3);
      expect(mockHttpController.get).toHaveBeenNthCalledWith(1, mockController, '/access/roles/role-alpha');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(2, mockController, '/access/roles/role-beta');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(3, mockController, '/access/roles/role-gamma');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in role_id', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'role-with-dash');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role-with-dash'
      );
    });

    it('should handle role_id with underscores', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'role_with_underscore');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role_with_underscore'
      );
    });

    it('should handle empty role name', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.create(mockController, { name: '', description: 'Desc' });

      expect(mockHttpController.post).toHaveBeenCalled();
    });

    it('should handle special characters in privilege ID', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.removePrivileges(mockController, 'role-1', 'priv-special');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role-1/privileges/priv-special'
      );
    });
  });
});
