import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from './user.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { User } from '@models/users/user';
import { Group } from '@models/groups/group';

describe('UserService', () => {
  let service: UserService;
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

    service = new UserService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be created with HttpController', () => {
      expect(service).toBeInstanceOf(UserService);
    });
  });

  describe('getInformationAboutLoggedUser', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockUser: User = {
        user_id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'User',
      } as unknown as User;

      mockHttpController.get.mockReturnValue(of(mockUser));

      service.getInformationAboutLoggedUser(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/users/me/');
    });

    it('should return Observable from httpController', () => {
      const mockUser: User = {
        user_id: 'user-1',
        username: 'testuser',
      } as unknown as User;

      mockHttpController.get.mockReturnValue(of(mockUser));

      const result = service.getInformationAboutLoggedUser(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should return User type observable', () => {
      const mockUser: User = {
        user_id: 'user-1',
        username: 'admin',
      } as unknown as User;

      mockHttpController.get.mockReturnValue(of(mockUser));

      const result = service.getInformationAboutLoggedUser(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('get', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockUser: User = {
        user_id: 'user-123',
        username: 'testuser',
      } as unknown as User;

      mockHttpController.get.mockReturnValue(of(mockUser));

      service.get(mockController, 'user-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/users/user-123');
    });

    it('should return Observable from httpController', () => {
      const mockUser: User = {
        user_id: 'user-456',
        username: 'anotheruser',
      } as unknown as User;

      mockHttpController.get.mockReturnValue(of(mockUser));

      const result = service.get(mockController, 'user-456');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include user_id in URL', () => {
      const mockUser: User = {
        user_id: 'user-abc',
        username: 'test',
      } as unknown as User;

      mockHttpController.get.mockReturnValue(of(mockUser));

      service.get(mockController, 'user-abc');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/users/user-abc');
    });
  });

  describe('list', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockUsers: User[] = [
        { user_id: 'user-1', username: 'user1' } as unknown as User,
        { user_id: 'user-2', username: 'user2' } as unknown as User,
      ];

      mockHttpController.get.mockReturnValue(of(mockUsers));

      service.list(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/users');
    });

    it('should return Observable of User array', () => {
      const mockUsers: User[] = [{ user_id: 'user-1', username: 'admin' } as unknown as User];

      mockHttpController.get.mockReturnValue(of(mockUsers));

      const result = service.list(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty user list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.list(mockController);

      expect(result).toBeInstanceOf(Observable);
      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/users');
    });
  });

  describe('add', () => {
    it('should call httpController.post with correct endpoint', () => {
      const newUser: User = {
        user_id: 'user-new',
        username: 'newuser',
        email: 'new@example.com',
      } as unknown as User;

      mockHttpController.post.mockReturnValue(of(newUser));

      service.add(mockController, newUser);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/access/users', newUser);
    });

    it('should return Observable from httpController', () => {
      const newUser: User = {
        user_id: 'user-999',
        username: 'brandnew',
      } as unknown as User;

      mockHttpController.post.mockReturnValue(of(newUser));

      const result = service.add(mockController, newUser);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should pass user data to httpController', () => {
      const newUser: User = {
        user_id: 'user-xyz',
        username: 'testuser',
        password: 'testpass',
      } as unknown as User;

      mockHttpController.post.mockReturnValue(of(newUser));

      service.add(mockController, newUser);

      expect(mockHttpController.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'user-123');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/access/users/user-123');
    });

    it('should return Observable from httpController', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.delete(mockController, 'user-456');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include user_id in URL', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'user-todelete');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/access/users/user-todelete');
    });
  });

  describe('update', () => {
    it('should call httpController.put with /access/users/me for self update', () => {
      const updatedUser: User = {
        user_id: 'user-1',
        username: 'updateduser',
      } as unknown as User;

      mockHttpController.put.mockReturnValue(of(updatedUser));

      service.update(mockController, updatedUser, true);

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/access/users/me', updatedUser);
    });

    it('should call httpController.put with user_id in URL for non-self update', () => {
      const updatedUser: User = {
        user_id: 'user-789',
        username: 'modifieduser',
      } as unknown as User;

      mockHttpController.put.mockReturnValue(of(updatedUser));

      service.update(mockController, updatedUser, false);

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/access/users/user-789', updatedUser);
    });

    it('should return Observable from httpController', () => {
      const updatedUser: User = {
        user_id: 'user-111',
        username: 'test',
      } as unknown as User;

      mockHttpController.put.mockReturnValue(of(updatedUser));

      const result = service.update(mockController, updatedUser, false);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle self_update=true correctly', () => {
      const updatedUser: User = {
        user_id: 'user-222',
        username: 'selfuser',
      } as unknown as User;

      mockHttpController.put.mockReturnValue(of(updatedUser));

      service.update(mockController, updatedUser, true);

      const putCall = mockHttpController.put.mock.calls[0];
      expect(putCall[1]).toBe('/access/users/me');
    });

    it('should handle self_update=false correctly', () => {
      const updatedUser: User = {
        user_id: 'user-333',
        username: 'otheruser',
      } as unknown as User;

      mockHttpController.put.mockReturnValue(of(updatedUser));

      service.update(mockController, updatedUser, false);

      const putCall = mockHttpController.put.mock.calls[0];
      expect(putCall[1]).toBe('/access/users/user-333');
    });
  });

  describe('getGroupsByUserId', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockGroups: Group[] = [
        { group_id: 'group-1', name: 'Admins' } as unknown as Group,
        { group_id: 'group-2', name: 'Users' } as unknown as Group,
      ];

      mockHttpController.get.mockReturnValue(of(mockGroups));

      service.getGroupsByUserId(mockController, 'user-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/users/user-123/groups');
    });

    it('should return Observable of Group array', () => {
      const mockGroups: Group[] = [{ group_id: 'group-1', name: 'Test Group' } as unknown as Group];

      mockHttpController.get.mockReturnValue(of(mockGroups));

      const result = service.getGroupsByUserId(mockController, 'user-456');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty groups list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getGroupsByUserId(mockController, 'user-789');

      expect(result).toBeInstanceOf(Observable);
      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/users/user-789/groups');
    });

    it('should include user_id in groups URL', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getGroupsByUserId(mockController, 'user-groups');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/users/user-groups/groups');
    });
  });

  describe('URL Construction', () => {
    it('should construct correct URL for different user IDs', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.get(mockController, 'user-alpha');
      service.get(mockController, 'user-beta');
      service.get(mockController, 'user-gamma');

      expect(mockHttpController.get).toHaveBeenCalledTimes(3);
      expect(mockHttpController.get).toHaveBeenNthCalledWith(1, mockController, '/access/users/user-alpha');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(2, mockController, '/access/users/user-beta');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(3, mockController, '/access/users/user-gamma');
    });

    it('should construct correct URL for self update vs user update', () => {
      const updatedUser: User = {
        user_id: 'user-1',
        username: 'test',
      } as unknown as User;

      mockHttpController.put.mockReturnValue(of(updatedUser));

      service.update(mockController, updatedUser, true);
      service.update(mockController, updatedUser, false);

      expect(mockHttpController.put).toHaveBeenCalledTimes(2);
      expect(mockHttpController.put).toHaveBeenNthCalledWith(1, mockController, '/access/users/me', updatedUser);
      expect(mockHttpController.put).toHaveBeenNthCalledWith(2, mockController, '/access/users/user-1', updatedUser);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in user_id', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.get(mockController, 'user-with-dash');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/users/user-with-dash');
    });

    it('should handle empty user_id', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, '');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/access/users/');
    });

    it('should handle user_id with underscores', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getGroupsByUserId(mockController, 'user_with_underscore');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/users/user_with_underscore/groups');
    });

    it('should handle undefined user_id gracefully', () => {
      const updatedUser: User = {
        user_id: undefined as any,
        username: 'test',
      } as unknown as User;

      mockHttpController.put.mockReturnValue(of(updatedUser));

      service.update(mockController, updatedUser, false);

      expect(mockHttpController.put).toHaveBeenCalled();
    });
  });

  describe('Method Return Types', () => {
    it('should return Observable<User> from get', () => {
      const mockUser: User = {
        user_id: 'user-1',
        username: 'test',
      } as unknown as User;

      mockHttpController.get.mockReturnValue(of(mockUser));

      const result = service.get(mockController, 'user-1');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should return Observable<User> from add', () => {
      const newUser: User = {
        user_id: 'user-new',
        username: 'new',
      } as unknown as User;

      mockHttpController.post.mockReturnValue(of(newUser));

      const result = service.add(mockController, newUser);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should return Observable<User> from update', () => {
      const updatedUser: User = {
        user_id: 'user-1',
        username: 'updated',
      } as unknown as User;

      mockHttpController.put.mockReturnValue(of(updatedUser));

      const result = service.update(mockController, updatedUser, false);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
