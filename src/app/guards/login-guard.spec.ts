import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { LoginGuard } from './login-guard';
import { ControllerService } from '@services/controller.service';
import { LoginService } from '@services/login.service';
import { Controller } from '@models/controller';

describe('LoginGuard', () => {
  let guard: LoginGuard;
  let mockControllerService: any;
  let mockLoginService: any;
  let mockRouter: any;

  const createMockController = (overrides: Partial<Controller> = {}): Controller => {
    const controller = new Controller();
    controller.id = 1;
    controller.name = 'Test Controller';
    controller.host = 'localhost';
    controller.port = 3080;
    controller.protocol = 'http:';
    controller.location = 'local';
    controller.authToken = 'valid-token';
    controller.tokenExpired = false;
    Object.assign(controller, overrides);
    return controller;
  };

  let mockRouteSnapshot: ActivatedRouteSnapshot;
  let mockStateSnapshot: RouterStateSnapshot;

  beforeEach(() => {
    vi.clearAllMocks();

    mockControllerService = {
      get: vi.fn(),
    };

    mockLoginService = {
      controller_id: '',
      getLoggedUser: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockRouteSnapshot = {
      paramMap: {
        get: () => '1',
      },
    } as unknown as ActivatedRouteSnapshot;

    mockStateSnapshot = {
      url: '/test-url',
    } as RouterStateSnapshot;

    guard = new LoginGuard(mockControllerService, mockLoginService, mockRouter);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true when controller has valid authToken and token is not expired', async () => {
      const mockController = createMockController({
        authToken: 'valid-token',
        tokenExpired: false,
      });
      mockControllerService.get.mockResolvedValue(mockController);
      mockLoginService.getLoggedUser.mockResolvedValue({});

      const result = await guard.canActivate(mockRouteSnapshot, mockStateSnapshot);

      expect(result).toBe(true);
      expect(mockLoginService.controller_id).toBe('1');
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should navigate to login when token is expired', async () => {
      const expiredController = createMockController({
        authToken: 'expired-token',
        tokenExpired: true,
      });
      mockControllerService.get.mockResolvedValue(expiredController);

      const result = await guard.canActivate(mockRouteSnapshot, mockStateSnapshot);

      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/controller', 1, 'login'],
        { queryParams: { returnUrl: '/test-url' } }
      );
    });

    it('should navigate to login when controller has no authToken', async () => {
      const noTokenController = createMockController({
        authToken: '',
        tokenExpired: false,
      });
      mockControllerService.get.mockResolvedValue(noTokenController);

      const result = await guard.canActivate(mockRouteSnapshot, mockStateSnapshot);

      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/controller', 1, 'login'],
        { queryParams: { returnUrl: '/test-url' } }
      );
    });

    it('should continue even when getLoggedUser throws an error', async () => {
      const mockController = createMockController({
        authToken: 'valid-token',
        tokenExpired: false,
      });
      mockControllerService.get.mockResolvedValue(mockController);
      mockLoginService.getLoggedUser.mockRejectedValue(new Error('Unauthorized'));

      const result = await guard.canActivate(mockRouteSnapshot, mockStateSnapshot);

      expect(result).toBe(true);
    });

    it('should set loginService.controller_id from route params', async () => {
      const mockController = createMockController();
      mockControllerService.get.mockResolvedValue(mockController);

      await guard.canActivate(mockRouteSnapshot, mockStateSnapshot);

      expect(mockLoginService.controller_id).toBe('1');
    });
  });
});
