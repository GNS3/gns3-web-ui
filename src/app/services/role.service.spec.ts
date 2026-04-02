import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';
import { RoleService } from './role.service';
import { HttpController } from './http-controller.service';
import { Controller } from '@models/controller';
import { Role } from '@models/api/role';

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
    it('should call httpController.get with correct endpoint and return roles', async () => {
      const mockRoles: Role[] = [
        { role_id: 'role-1', name: 'Admin', description: 'Administrator' } as Role,
        { role_id: 'role-2', name: 'User', description: 'Regular user' } as Role,
      ];

      mockHttpController.get.mockReturnValue(of(mockRoles));

      const result = service.get(mockController);
      const emittedValue = await firstValueFrom(result);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/roles');
      expect(emittedValue).toEqual(mockRoles);
    });

    it('should handle empty roles list', async () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.get(mockController);
      const emittedValue = await firstValueFrom(result);

      expect(emittedValue).toEqual([]);
    });

    it('should propagate error when get fails', async () => {
      const error = new Error('Server Error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      const result = service.get(mockController);

      await expect(firstValueFrom(result)).rejects.toThrow('Server Error');
    });
  });

  describe('delete', () => {
    it.each([
      { roleId: 'role-123', expectedUrl: '/access/roles/role-123' },
      { roleId: 'role-with-dash', expectedUrl: '/access/roles/role-with-dash' },
      { roleId: 'role_with_underscore', expectedUrl: '/access/roles/role_with_underscore' },
    ])('should call httpController.delete with correct endpoint for $roleId', async ({ roleId, expectedUrl }) => {
      mockHttpController.delete.mockReturnValue(of({}));

      await firstValueFrom(service.delete(mockController, roleId));

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, expectedUrl);
    });

    it('should return the deleted role', async () => {
      const deletedRole = { role_id: 'role-123', name: 'Deleted Role' };
      mockHttpController.delete.mockReturnValue(of(deletedRole));

      const result = await firstValueFrom(service.delete(mockController, 'role-123'));

      expect(result).toEqual(deletedRole);
    });

    it('should propagate error when delete fails', async () => {
      const error = new Error('Not Found');
      mockHttpController.delete.mockReturnValue(throwError(() => error));

      const result = service.delete(mockController, 'role-123');

      await expect(firstValueFrom(result)).rejects.toThrow('Not Found');
    });
  });

  describe('create', () => {
    it('should call httpController.post with correct endpoint and payload', async () => {
      const newRole = { name: 'New Role', description: 'New role description' };
      const createdRole = { role_id: 'new-role-id', ...newRole };
      mockHttpController.post.mockReturnValue(of(createdRole));

      const result = await firstValueFrom(service.create(mockController, newRole));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/access/roles',
        newRole
      );
      expect(result).toEqual(createdRole);
    });

    it('should propagate error when create fails', async () => {
      const error = new Error('Conflict');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      const result = service.create(mockController, { name: 'Test', description: 'Desc' });

      await expect(firstValueFrom(result)).rejects.toThrow('Conflict');
    });
  });

  describe('getById', () => {
    it('should call httpController.get with correct endpoint and return role', async () => {
      const mockRole: Role = { role_id: 'role-1', name: 'Admin', description: 'Admin role' } as Role;
      mockHttpController.get.mockReturnValue(of(mockRole));

      const result = await firstValueFrom(service.getById(mockController, 'role-1'));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/roles/role-1');
      expect(result).toEqual(mockRole);
    });

    it('should propagate error when getById fails', async () => {
      const error = new Error('Not Found');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      const result = service.getById(mockController, 'role-1');

      await expect(firstValueFrom(result)).rejects.toThrow('Not Found');
    });
  });

  describe('update', () => {
    it('should call httpController.put with correct endpoint and payload', async () => {
      const mockRole: Role = {
        role_id: 'role-1',
        name: 'Updated Role',
        description: 'Updated description',
      } as Role;
      mockHttpController.put.mockReturnValue(of(mockRole));

      const result = await firstValueFrom(service.update(mockController, mockRole));

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role-1',
        { name: 'Updated Role', description: 'Updated description' }
      );
      expect(result).toEqual(mockRole);
    });

    it('should only pass name and description in payload (not role_id)', async () => {
      const mockRole: Role = {
        role_id: 'role-2',
        name: 'Role Name',
        description: 'Role Description',
      } as Role;
      mockHttpController.put.mockReturnValue(of(mockRole));

      await firstValueFrom(service.update(mockController, mockRole));

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload).toEqual({ name: 'Role Name', description: 'Role Description' });
      expect(payload).not.toHaveProperty('role_id');
    });

    it('should propagate error when update fails', async () => {
      const error = new Error('Conflict');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      const result = service.update(mockController, { role_id: 'role-1', name: 'Test', description: 'Desc' } as Role);

      await expect(firstValueFrom(result)).rejects.toThrow('Conflict');
    });
  });

  describe('setPrivileges', () => {
    it('should call httpController.put with correct endpoint and undefined body', async () => {
      mockHttpController.put.mockReturnValue(of({}));

      const result = await firstValueFrom(service.setPrivileges(mockController, 'role-1', 'priv-1'));

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/roles/role-1/privileges/priv-1',
        undefined
      );
      expect(result).toEqual({});
    });

    it('should propagate error when setPrivileges fails', async () => {
      const error = new Error('Server Error');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      const result = service.setPrivileges(mockController, 'role-1', 'priv-1');

      await expect(firstValueFrom(result)).rejects.toThrow('Server Error');
    });
  });

  describe('removePrivileges', () => {
    it.each([
      { roleId: 'role-1', privilegeId: 'priv-1', expectedUrl: '/access/roles/role-1/privileges/priv-1' },
      { roleId: 'role-to-update', privilegeId: 'priv-to-remove', expectedUrl: '/access/roles/role-to-update/privileges/priv-to-remove' },
    ])('should call httpController.delete with correct endpoint for $roleId/$privilegeId', async ({ roleId, privilegeId, expectedUrl }) => {
      mockHttpController.delete.mockReturnValue(of({}));

      await firstValueFrom(service.removePrivileges(mockController, roleId, privilegeId));

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, expectedUrl);
    });

    it('should propagate error when removePrivileges fails', async () => {
      const error = new Error('Not Found');
      mockHttpController.delete.mockReturnValue(throwError(() => error));

      const result = service.removePrivileges(mockController, 'role-1', 'priv-1');

      await expect(firstValueFrom(result)).rejects.toThrow('Not Found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty role name in create', async () => {
      mockHttpController.post.mockReturnValue(of({ role_id: 'new-id', name: '', description: 'Desc' }));

      const result = await firstValueFrom(service.create(mockController, { name: '', description: 'Desc' }));

      expect(mockHttpController.post).toHaveBeenCalled();
      expect(result).toEqual({ role_id: 'new-id', name: '', description: 'Desc' });
    });
  });
});
