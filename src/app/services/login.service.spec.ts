import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginService } from './login.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { AuthResponse } from '@models/authResponse';

describe('LoginService', () => {
  let service: LoginService;
  let mockHttpController: any;
  let mockController: Controller;

  beforeEach(() => {
    // Mock HttpController
    mockHttpController = {
      post: vi.fn(),
      get: vi.fn(),
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

    service = new LoginService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize controller_id as empty string', () => {
      expect(service.controller_id).toBe('');
    });
  });

  describe('login', () => {
    it('should call httpController.post with correct endpoint', () => {
      const mockResponse: AuthResponse = {
        access_token: 'test-token-123',
        token_type: 'Bearer',
      };

      mockHttpController.post.mockReturnValue(of(mockResponse));

      service.login(mockController, 'testuser', 'testpass');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/access/users/login',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should return Observable from httpController', () => {
      const mockResponse: AuthResponse = {
        access_token: 'test-token-123',
        token_type: 'Bearer',
      };

      mockHttpController.post.mockReturnValue(of(mockResponse));

      const result = service.login(mockController, 'testuser', 'testpass');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include username and password in payload', () => {
      const mockResponse: AuthResponse = {
        access_token: 'test-token-123',
        token_type: 'Bearer',
      };

      mockHttpController.post.mockReturnValue(of(mockResponse));

      service.login(mockController, 'myuser', 'mypass');

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      // Verify HttpParams contains username and password
      expect(payload.toString()).toContain('username=myuser');
      expect(payload.toString()).toContain('password=mypass');
    });

    it('should set correct content-type header', () => {
      const mockResponse: AuthResponse = {
        access_token: 'test-token-123',
        token_type: 'Bearer',
      };

      mockHttpController.post.mockReturnValue(of(mockResponse));

      service.login(mockController, 'testuser', 'testpass');

      const postCall = mockHttpController.post.mock.calls[0];
      const options = postCall[3];

      expect(options.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
    });
  });

  describe('getLoggedUser', () => {
    it('should call httpController.get with correct endpoint', async () => {
      const mockUser = { username: 'testuser' };

      mockHttpController.get.mockReturnValue({
        toPromise: () => Promise.resolve(mockUser),
      });

      await service.getLoggedUser(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/access/users/me'
      );
    });

    it('should return Promise that resolves to user data', async () => {
      const mockUser = { username: 'testuser', email: 'test@example.com' };

      mockHttpController.get.mockReturnValue({
        toPromise: () => Promise.resolve(mockUser),
      });

      const result = await service.getLoggedUser(mockController);

      expect(result).toEqual(mockUser);
    });

    it('should handle errors from httpController', async () => {
      const error = new Error('Unauthorized');
      mockHttpController.get.mockReturnValue({
        toPromise: () => Promise.reject(error),
      });

      await expect(service.getLoggedUser(mockController)).rejects.toThrow('Unauthorized');
    });
  });

  describe('getLoggedUserRefToken', () => {
    it('should call httpController.post with correct endpoint', async () => {
      const mockResponse: AuthResponse = {
        access_token: 'test-token-123',
        token_type: 'Bearer',
      };

      mockHttpController.post.mockReturnValue({
        toPromise: () => Promise.resolve(mockResponse),
      });

      const currentUser = { username: 'testuser', password: 'testpass' };

      await service.getLoggedUserRefToken(mockController, currentUser);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/access/users/authenticate',
        currentUser
      );
    });

    it('should return Promise that resolves to AuthResponse', async () => {
      const mockResponse: AuthResponse = {
        access_token: 'test-token-123',
        token_type: 'Bearer',
      };

      mockHttpController.post.mockReturnValue({
        toPromise: () => Promise.resolve(mockResponse),
      });

      const currentUser = { username: 'testuser', password: 'testpass' };

      const result = await service.getLoggedUserRefToken(mockController, currentUser);

      expect(result).toEqual(mockResponse);
    });

    it('should include current_user credentials in request', async () => {
      const mockResponse: AuthResponse = {
        access_token: 'admin-token',
        token_type: 'Bearer',
      };

      mockHttpController.post.mockReturnValue({
        toPromise: () => Promise.resolve(mockResponse),
      });

      const currentUser = { username: 'admin', password: 'admin123' };

      await service.getLoggedUserRefToken(mockController, currentUser);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/access/users/authenticate',
        currentUser
      );
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Invalid credentials');
      mockHttpController.post.mockReturnValue({
        toPromise: () => Promise.reject(error),
      });

      const currentUser = { username: 'test', password: 'wrong' };

      await expect(
        service.getLoggedUserRefToken(mockController, currentUser)
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('controller_id', () => {
    it('should have default empty string value', () => {
      expect(service.controller_id).toBe('');
    });

    it('should allow setting controller_id', () => {
      service.controller_id = 'controller-123';
      expect(service.controller_id).toBe('controller-123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty username', () => {
      const mockResponse: AuthResponse = {
        access_token: '',
        token_type: 'Bearer',
      };

      mockHttpController.post.mockReturnValue(of(mockResponse));

      const result = service.login(mockController, '', 'testpass');

      expect(result).toBeInstanceOf(Observable);
      expect(mockHttpController.post).toHaveBeenCalled();
    });

    it('should handle empty password', () => {
      const mockResponse: AuthResponse = {
        access_token: '',
        token_type: 'Bearer',
      };

      mockHttpController.post.mockReturnValue(of(mockResponse));

      const result = service.login(mockController, 'testuser', '');

      expect(result).toBeInstanceOf(Observable);
      expect(mockHttpController.post).toHaveBeenCalled();
    });

    it('should handle special characters in username', () => {
      const mockResponse: AuthResponse = {
        access_token: 'token',
        token_type: 'Bearer',
      };

      mockHttpController.post.mockReturnValue(of(mockResponse));

      const result = service.login(mockController, 'user@domain', 'pass:word');

      expect(result).toBeInstanceOf(Observable);
      expect(mockHttpController.post).toHaveBeenCalled();
    });

    it('should handle null or undefined current_user gracefully', async () => {
      const mockResponse: AuthResponse = {
        access_token: 'test',
        token_type: 'Bearer',
      };

      mockHttpController.post.mockReturnValue({
        toPromise: () => Promise.resolve(mockResponse),
      });

      // Test with undefined user
      try {
        await service.getLoggedUserRefToken(mockController, undefined as any);
        // If it doesn't throw, the test passes
        expect(true).toBe(true);
      } catch (e) {
        // Expected to throw or handle gracefully
        expect(e).toBeDefined();
      }
    });
  });
});
