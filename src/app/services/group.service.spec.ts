import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GroupService } from './group.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { Group } from '@models/groups/group';
import { User } from '@models/users/user';
import { Role } from '@models/api/role';

describe('GroupService', () => {
  let service: GroupService;
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

    service = new GroupService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be created with HttpController', () => {
      expect(service).toBeInstanceOf(GroupService);
    });
  });

  describe('getGroups', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockGroups: Group[] = [
        { user_group_id: 'group-1', name: 'Admins' } as Group,
        { user_group_id: 'group-2', name: 'Users' } as Group,
      ];

      mockHttpController.get.mockReturnValue(of(mockGroups));

      service.getGroups(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/groups');
    });

    it('should return Observable from httpController', () => {
      const mockGroups: Group[] = [{ user_group_id: 'group-1', name: 'Test' } as Group];

      mockHttpController.get.mockReturnValue(of(mockGroups));

      const result = service.getGroups(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty groups list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getGroups(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getGroupMember', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockUsers: User[] = [
        { user_id: 'user-1', username: 'user1' } as User,
        { user_id: 'user-2', username: 'user2' } as User,
      ];

      mockHttpController.get.mockReturnValue(of(mockUsers));

      service.getGroupMember(mockController, 'group-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/groups/group-123/members');
    });

    it('should return Observable of User array', () => {
      const mockUsers: User[] = [{ user_id: 'user-1', username: 'admin' } as User];

      mockHttpController.get.mockReturnValue(of(mockUsers));

      const result = service.getGroupMember(mockController, 'group-456');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty members list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getGroupMember(mockController, 'group-empty');

      expect(result).toBeInstanceOf(Observable);
      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/groups/group-empty/members');
    });
  });

  describe('addGroup', () => {
    it('should call httpController.post with correct endpoint and payload', () => {
      const newGroup: Group = {
        user_group_id: 'group-new',
        name: 'New Group',
      } as Group;

      mockHttpController.post.mockReturnValue(of(newGroup));

      service.addGroup(mockController, 'New Group');

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/access/groups', { name: 'New Group' });
    });

    it('should return Observable from httpController', () => {
      const newGroup: Group = {
        user_group_id: 'group-999',
        name: 'Brand New',
      } as Group;

      mockHttpController.post.mockReturnValue(of(newGroup));

      const result = service.addGroup(mockController, 'Brand New');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should pass group name in payload', () => {
      const newGroup: Group = {
        user_group_id: 'group-xyz',
        name: 'Test Group',
      } as Group;

      mockHttpController.post.mockReturnValue(of(newGroup));

      service.addGroup(mockController, 'Test Group');

      const postCall = mockHttpController.post.mock.calls[0];
      expect(postCall[2]).toEqual({ name: 'Test Group' });
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'group-123');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/access/groups/group-123');
    });

    it('should return Observable from httpController', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.delete(mockController, 'group-456');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include group_id in URL', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'group-todelete');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/access/groups/group-todelete');
    });
  });

  describe('get', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockGroup: Group = {
        user_group_id: 'group-789',
        name: 'Test Group',
      } as Group;

      mockHttpController.get.mockReturnValue(of(mockGroup));

      service.get(mockController, 'group-789');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/groups/group-789');
    });

    it('should return Observable from httpController', () => {
      const mockGroup: Group = {
        user_group_id: 'group-111',
        name: 'Test',
      } as Group;

      mockHttpController.get.mockReturnValue(of(mockGroup));

      const result = service.get(mockController, 'group-111');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('addMemberToGroup', () => {
    it('should call httpController.put with correct endpoint', () => {
      const mockGroup: Group = {
        user_group_id: 'group-123',
        name: 'Test Group',
      } as Group;

      const mockUser: User = {
        user_id: 'user-456',
        username: 'testuser',
      } as User;

      mockHttpController.put.mockReturnValue(of({}));

      service.addMemberToGroup(mockController, mockGroup, mockUser);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-123/members/user-456',
        {}
      );
    });

    it('should return Observable from httpController', () => {
      const mockGroup: Group = {
        user_group_id: 'group-abc',
        name: 'Group',
      } as Group;

      const mockUser: User = {
        user_id: 'user-xyz',
        username: 'user',
      } as User;

      mockHttpController.put.mockReturnValue(of({}));

      const result = service.addMemberToGroup(mockController, mockGroup, mockUser);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include empty body in put request', () => {
      const mockGroup: Group = {
        user_group_id: 'group-1',
        name: 'G1',
      } as Group;

      const mockUser: User = {
        user_id: 'user-1',
        username: 'u1',
      } as User;

      mockHttpController.put.mockReturnValue(of({}));

      service.addMemberToGroup(mockController, mockGroup, mockUser);

      const putCall = mockHttpController.put.mock.calls[0];
      expect(putCall[2]).toEqual({});
    });
  });

  describe('removeUser', () => {
    it('should call httpController.delete with correct endpoint', () => {
      const mockGroup: Group = {
        user_group_id: 'group-123',
        name: 'Test Group',
      } as Group;

      const mockUser: User = {
        user_id: 'user-456',
        username: 'testuser',
      } as User;

      mockHttpController.delete.mockReturnValue(of({}));

      service.removeUser(mockController, mockGroup, mockUser);

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-123/members/user-456'
      );
    });

    it('should return Observable from httpController', () => {
      const mockGroup: Group = {
        user_group_id: 'group-abc',
        name: 'Group',
      } as Group;

      const mockUser: User = {
        user_id: 'user-xyz',
        username: 'user',
      } as User;

      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.removeUser(mockController, mockGroup, mockUser);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should construct correct URL with group and user IDs', () => {
      const mockGroup: Group = {
        user_group_id: 'group-delete',
        name: 'Delete Group',
      } as Group;

      const mockUser: User = {
        user_id: 'user-remove',
        username: 'removeuser',
      } as User;

      mockHttpController.delete.mockReturnValue(of({}));

      service.removeUser(mockController, mockGroup, mockUser);

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-delete/members/user-remove'
      );
    });
  });

  describe('update', () => {
    it('should call httpController.put with correct endpoint and payload', () => {
      const mockGroup: Group = {
        user_group_id: 'group-789',
        name: 'Updated Group',
      } as Group;

      mockHttpController.put.mockReturnValue(of(mockGroup));

      service.update(mockController, mockGroup);

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/access/groups/group-789', {
        name: 'Updated Group',
      });
    });

    it('should return Observable from httpController', () => {
      const mockGroup: Group = {
        user_group_id: 'group-111',
        name: 'Test',
      } as Group;

      mockHttpController.put.mockReturnValue(of(mockGroup));

      const result = service.update(mockController, mockGroup);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should pass group name in payload', () => {
      const mockGroup: Group = {
        user_group_id: 'group-xyz',
        name: 'Test Group Name',
      } as Group;

      mockHttpController.put.mockReturnValue(of(mockGroup));

      service.update(mockController, mockGroup);

      const putCall = mockHttpController.put.mock.calls[0];
      expect(putCall[2]).toEqual({ name: 'Test Group Name' });
    });
  });

  describe('getGroupRole', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockRoles: Role[] = [
        { role_id: 'role-1', name: 'Admin' } as Role,
        { role_id: 'role-2', name: 'User' } as Role,
      ];

      mockHttpController.get.mockReturnValue(of(mockRoles));

      service.getGroupRole(mockController, 'group-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/groups/group-123/roles');
    });

    it('should return Observable of Role array', () => {
      const mockRoles: Role[] = [{ role_id: 'role-1', name: 'Admin' } as Role];

      mockHttpController.get.mockReturnValue(of(mockRoles));

      const result = service.getGroupRole(mockController, 'group-456');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty roles list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getGroupRole(mockController, 'group-empty');

      expect(result).toBeInstanceOf(Observable);
      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/groups/group-empty/roles');
    });
  });

  describe('removeRole', () => {
    it('should call httpController.delete with correct endpoint', () => {
      const mockGroup: Group = {
        user_group_id: 'group-123',
        name: 'Test Group',
      } as Group;

      const mockRole: Role = {
        role_id: 'role-456',
        name: 'Test Role',
      } as Role;

      mockHttpController.delete.mockReturnValue(of({}));

      service.removeRole(mockController, mockGroup, mockRole);

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/access/groups/group-123/roles/role-456');
    });

    it('should return Observable from httpController', () => {
      const mockGroup: Group = {
        user_group_id: 'group-abc',
        name: 'Group',
      } as Group;

      const mockRole: Role = {
        role_id: 'role-xyz',
        name: 'Role',
      } as Role;

      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.removeRole(mockController, mockGroup, mockRole);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should construct correct URL with group and role IDs', () => {
      const mockGroup: Group = {
        user_group_id: 'group-del',
        name: 'Delete Group',
      } as Group;

      const mockRole: Role = {
        role_id: 'role-remove',
        name: 'Remove Role',
      } as Role;

      mockHttpController.delete.mockReturnValue(of({}));

      service.removeRole(mockController, mockGroup, mockRole);

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-del/roles/role-remove'
      );
    });
  });

  describe('addRoleToGroup', () => {
    it('should call httpController.put with correct endpoint', () => {
      const mockGroup: Group = {
        user_group_id: 'group-123',
        name: 'Test Group',
      } as Group;

      const mockRole: Role = {
        role_id: 'role-456',
        name: 'Test Role',
      } as Role;

      mockHttpController.put.mockReturnValue(of({}));

      service.addRoleToGroup(mockController, mockGroup, mockRole);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-123/roles/role-456',
        {}
      );
    });

    it('should return Observable from httpController', () => {
      const mockGroup: Group = {
        user_group_id: 'group-abc',
        name: 'Group',
      } as Group;

      const mockRole: Role = {
        role_id: 'role-xyz',
        name: 'Role',
      } as Role;

      mockHttpController.put.mockReturnValue(of({}));

      const result = service.addRoleToGroup(mockController, mockGroup, mockRole);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include empty body in put request', () => {
      const mockGroup: Group = {
        user_group_id: 'group-1',
        name: 'G1',
      } as Group;

      const mockRole: Role = {
        role_id: 'role-1',
        name: 'R1',
      } as Role;

      mockHttpController.put.mockReturnValue(of({}));

      service.addRoleToGroup(mockController, mockGroup, mockRole);

      const putCall = mockHttpController.put.mock.calls[0];
      expect(putCall[2]).toEqual({});
    });
  });

  describe('URL Construction', () => {
    it('should construct correct URL for different group IDs', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getGroupMember(mockController, 'group-alpha');
      service.getGroupMember(mockController, 'group-beta');
      service.getGroupMember(mockController, 'group-gamma');

      expect(mockHttpController.get).toHaveBeenCalledTimes(3);
      expect(mockHttpController.get).toHaveBeenNthCalledWith(1, mockController, '/access/groups/group-alpha/members');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(2, mockController, '/access/groups/group-beta/members');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(3, mockController, '/access/groups/group-gamma/members');
    });

    it('should construct correct URL for member operations', () => {
      const mockGroup: Group = {
        user_group_id: 'group-1',
        name: 'G1',
      } as Group;

      const mockUser: User = {
        user_id: 'user-1',
        username: 'u1',
      } as User;

      mockHttpController.put.mockReturnValue(of({}));
      mockHttpController.delete.mockReturnValue(of({}));

      service.addMemberToGroup(mockController, mockGroup, mockUser);
      service.removeUser(mockController, mockGroup, mockUser);

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/access/groups/group-1/members/user-1', {});
      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/access/groups/group-1/members/user-1');
    });

    it('should construct correct URL for role operations', () => {
      const mockGroup: Group = {
        user_group_id: 'group-1',
        name: 'G1',
      } as Group;

      const mockRole: Role = {
        role_id: 'role-1',
        name: 'R1',
      } as Role;

      mockHttpController.put.mockReturnValue(of({}));
      mockHttpController.delete.mockReturnValue(of({}));

      service.addRoleToGroup(mockController, mockGroup, mockRole);
      service.removeRole(mockController, mockGroup, mockRole);

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/access/groups/group-1/roles/role-1', {});
      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/access/groups/group-1/roles/role-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in group ID', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.get(mockController, 'group-with-dash');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/groups/group-with-dash');
    });

    it('should handle special characters in user ID', () => {
      const mockGroup: Group = {
        user_group_id: 'group-1',
        name: 'G1',
      } as Group;

      const mockUser: User = {
        user_id: 'user_with_underscore',
        username: 'test',
      } as User;

      mockHttpController.delete.mockReturnValue(of({}));

      service.removeUser(mockController, mockGroup, mockUser);

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-1/members/user_with_underscore'
      );
    });

    it('should handle empty group ID', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.get(mockController, '');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/groups/');
    });

    it('should handle empty group name', () => {
      const newGroup: Group = {
        user_group_id: 'group-new',
        name: '',
      } as Group;

      mockHttpController.post.mockReturnValue(of(newGroup));

      service.addGroup(mockController, '');

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/access/groups', { name: '' });
    });

    it('should handle group name with special characters', () => {
      const newGroup: Group = {
        user_group_id: 'group-new',
        name: 'Test Group (Admin)',
      } as Group;

      mockHttpController.post.mockReturnValue(of(newGroup));

      service.addGroup(mockController, 'Test Group (Admin)');

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/access/groups', {
        name: 'Test Group (Admin)',
      });
    });

    it('should handle group name with unicode characters', () => {
      const newGroup: Group = {
        user_group_id: 'group-new',
        name: 'Admin Group',
      } as Group;

      mockHttpController.post.mockReturnValue(of(newGroup));

      service.addGroup(mockController, 'Admin Group');

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/access/groups', { name: 'Admin Group' });
    });
  });
});
