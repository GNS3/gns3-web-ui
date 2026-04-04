import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { HttpRequestsInterceptor } from './http.interceptor';
import { ControllerService } from '@services/controller.service';
import { LoginService } from '@services/login.service';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { Controller } from '@models/controller';

describe('HttpRequestsInterceptor', () => {
  let interceptor: HttpRequestsInterceptor;
  let mockControllerService: any;
  let mockLoginService: any;
  let mockNext: HttpHandler;
  let mockRequest: HttpRequest<any>;

  const mockController: Controller = {
    id: 1,
    authToken: 'test-token',
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    tokenExpired: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockControllerService = {
      get: vi.fn(),
      update: vi.fn(),
    };

    mockLoginService = {
      controller_id: '1',
      getLoggedUserRefToken: vi.fn(),
      getLoggedUser: vi.fn(),
    };

    mockNext = {
      handle: vi.fn().mockReturnValue(of({} as HttpEvent<any>)),
    } as any as HttpHandler;

    mockRequest = new HttpRequest('GET', '/api/test');

    interceptor = new HttpRequestsInterceptor(mockControllerService, mockLoginService);
  });

  describe('intercept', () => {
    it('should create the interceptor', () => {
      expect(interceptor).toBeTruthy();
    });

    it('should pass request to next handler', () => {
      interceptor.intercept(mockRequest, mockNext);

      expect(mockNext.handle).toHaveBeenCalledWith(mockRequest);
    });

    it('should return an Observable from next.handle', () => {
      const result = interceptor.intercept(mockRequest, mockNext);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should catch errors and re-throw them', () => {
      const errorResponse = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
      (mockNext.handle as any).mockReturnValue(throwError(() => errorResponse));

      const result = interceptor.intercept(mockRequest, mockNext);
      let errorReceived: any;

      result.subscribe({
        error: (err) => {
          errorReceived = err;
        },
      });

      expect(errorReceived).toBe(errorResponse);
    });

    it('should pass through successful responses', () => {
      const successEvent = { type: 0 } as HttpEvent<any>;
      (mockNext.handle as any).mockReturnValue(of(successEvent));

      const result = interceptor.intercept(mockRequest, mockNext);
      let receivedEvent: any;

      result.subscribe((event) => {
        receivedEvent = event;
      });

      expect(receivedEvent).toBe(successEvent);
    });

    it('should handle network errors', () => {
      const networkError = new ErrorEvent('Network error');
      (mockNext.handle as any).mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              error: networkError,
              status: 0,
              statusText: 'Unknown Error',
            })
        )
      );

      const result = interceptor.intercept(mockRequest, mockNext);
      let errorReceived: any;

      result.subscribe({
        error: (err) => {
          errorReceived = err;
        },
      });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
    });
  });

  describe('call', () => {
    let mockLocalStorage: any;

    beforeEach(() => {
      mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('null'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      vi.stubGlobal('localStorage', mockLocalStorage);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should get controller by id from loginService.controller_id', async () => {
      mockLoginService.controller_id = '42';
      mockControllerService.get.mockResolvedValue({ ...mockController });
      mockControllerService.update.mockResolvedValue({});
      mockLoginService.getLoggedUserRefToken.mockResolvedValue({
        access_token: 'new-token',
      });
      mockLoginService.getLoggedUser.mockResolvedValue({});
      vi.spyOn(interceptor, 'reloadCurrentRoute').mockImplementation(() => {});

      await interceptor.call();

      expect(mockControllerService.get).toHaveBeenCalledWith(42);
    });

    it('should set tokenExpired to true on controller', async () => {
      const controllerCopy = { ...mockController };
      mockControllerService.get.mockResolvedValue(controllerCopy);
      mockControllerService.update.mockResolvedValue({});
      mockLoginService.getLoggedUserRefToken.mockResolvedValue({
        access_token: 'new-token',
      });
      mockLoginService.getLoggedUser.mockResolvedValue({});
      vi.spyOn(interceptor, 'reloadCurrentRoute').mockImplementation(() => {});

      await interceptor.call();

      // First call to update should have tokenExpired: true
      const firstUpdateCall = mockControllerService.update.mock.calls[0][0];
      expect(firstUpdateCall.tokenExpired).toBe(true);
    });

    it('should refresh token when isRememberMe is true', async () => {
      const storedUser = { isRememberMe: true, username: 'testuser' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
      mockControllerService.get.mockResolvedValue({ ...mockController });
      mockControllerService.update.mockResolvedValue({});
      mockLoginService.getLoggedUserRefToken.mockResolvedValue({
        access_token: 'refreshed-token',
      });
      mockLoginService.getLoggedUser.mockResolvedValue({});
      vi.spyOn(interceptor, 'reloadCurrentRoute').mockImplementation(() => {});

      await interceptor.call();

      expect(mockLoginService.getLoggedUserRefToken).toHaveBeenCalled();
      // The second argument should be storedUser (the getCurrentUser from localStorage)
      const secondArg = mockLoginService.getLoggedUserRefToken.mock.calls[0][1];
      expect(secondArg).toEqual(storedUser);

      // After token refresh, update should be called again with tokenExpired: false
      const secondUpdateCall = mockControllerService.update.mock.calls[1][0];
      expect(secondUpdateCall.authToken).toBe('refreshed-token');
      expect(secondUpdateCall.tokenExpired).toBe(false);
    });

    it('should update controller with new auth token', async () => {
      const storedUser = { isRememberMe: true };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
      const controllerCopy = { ...mockController };
      mockControllerService.get.mockResolvedValue(controllerCopy);
      mockControllerService.update.mockResolvedValue({});
      mockLoginService.getLoggedUserRefToken.mockResolvedValue({
        access_token: 'new-auth-token',
      });
      mockLoginService.getLoggedUser.mockResolvedValue({});
      vi.spyOn(interceptor, 'reloadCurrentRoute').mockImplementation(() => {});

      await interceptor.call();

      // Second call to update (after token refresh) should have tokenExpired: false and new token
      const secondUpdateCall = mockControllerService.update.mock.calls[1][0];
      expect(secondUpdateCall.authToken).toBe('new-auth-token');
      expect(secondUpdateCall.tokenExpired).toBe(false);
    });

    it('should call getLoggedUser after token refresh', async () => {
      const storedUser = { isRememberMe: true };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
      const controllerCopy = { ...mockController };
      mockControllerService.get.mockResolvedValue(controllerCopy);
      mockControllerService.update.mockResolvedValue({});
      mockLoginService.getLoggedUserRefToken.mockResolvedValue({
        access_token: 'new-token',
      });
      mockLoginService.getLoggedUser.mockResolvedValue({});
      vi.spyOn(interceptor, 'reloadCurrentRoute').mockImplementation(() => {});

      await interceptor.call();

      expect(mockLoginService.getLoggedUser).toHaveBeenCalled();
      // The controller passed should have tokenExpired: false (restored after refresh)
      const getLoggedUserCallArgs = mockLoginService.getLoggedUser.mock.calls[0][0];
      expect(getLoggedUserCallArgs.tokenExpired).toBe(false);
    });

    it('should not call token refresh when isRememberMe is false', async () => {
      const storedUser = { isRememberMe: false };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
      const controllerCopy = { ...mockController };
      mockControllerService.get.mockResolvedValue(controllerCopy);
      mockControllerService.update.mockResolvedValue({});
      vi.spyOn(interceptor, 'reloadCurrentRoute').mockImplementation(() => {});

      await interceptor.call();

      expect(mockLoginService.getLoggedUserRefToken).not.toHaveBeenCalled();
    });

    it('should not call token refresh when isRememberMe is null', async () => {
      // Return "null" string so JSON.parse returns null value (not throw)
      mockLocalStorage.getItem.mockReturnValue('null');
      const controllerCopy = { ...mockController };
      mockControllerService.get.mockResolvedValue(controllerCopy);
      mockControllerService.update.mockResolvedValue({});
      vi.spyOn(interceptor, 'reloadCurrentRoute').mockImplementation(() => {});

      await interceptor.call();

      expect(mockLoginService.getLoggedUserRefToken).not.toHaveBeenCalled();
    });

    it('should propagate error when getLoggedUserRefToken fails', async () => {
      const storedUser = { isRememberMe: true };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
      const controllerCopy = { ...mockController };
      mockControllerService.get.mockResolvedValue(controllerCopy);
      mockControllerService.update.mockResolvedValue({});
      mockLoginService.getLoggedUserRefToken.mockRejectedValue(new Error('Token refresh failed'));

      await expect(interceptor.call()).rejects.toThrow('Token refresh failed');
    });

    it('should propagate error when getLoggedUser fails', async () => {
      const storedUser = { isRememberMe: true };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
      const controllerCopy = { ...mockController };
      mockControllerService.get.mockResolvedValue(controllerCopy);
      mockControllerService.update.mockResolvedValue({});
      mockLoginService.getLoggedUserRefToken.mockResolvedValue({
        access_token: 'new-token',
      });
      mockLoginService.getLoggedUser.mockRejectedValue(new Error('Get user failed'));

      await expect(interceptor.call()).rejects.toThrow('Get user failed');
    });

    it('should handle get controller returning null', async () => {
      mockLoginService.controller_id = '999';
      mockControllerService.get.mockResolvedValue(null);

      await expect(interceptor.call()).rejects.toThrow();
    });
  });

  describe('reloadCurrentRoute', () => {
    beforeAll(() => {
      vi.stubGlobal('location', {
        reload: vi.fn(),
      });
    });

    afterAll(() => {
      vi.unstubAllGlobals();
    });

    beforeEach(() => {
      // Reset location.reload mock
      vi.mocked(location.reload).mockReset();
    });

    it('should call location.reload', () => {
      interceptor.reloadCurrentRoute();

      expect(location.reload).toHaveBeenCalled();
    });

    it('should be callable multiple times', () => {
      interceptor.reloadCurrentRoute();
      interceptor.reloadCurrentRoute();

      expect(location.reload).toHaveBeenCalledTimes(2);
    });
  });
});
