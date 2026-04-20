import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoleDetailResolver } from './role-detail.resolver';
import { ControllerService } from '@services/controller.service';
import { RoleService } from '@services/role.service';
import { Controller } from '@models/controller';
import { Role } from '@models/api/role';
import { of, Observable, throwError } from 'rxjs';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

/**
 * Helper function to create mock Controller
 */
function createMockController(partial?: Partial<Controller>): Controller {
  return {
    id: 1,
    authToken: '',
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    path: '',
    ubridge_path: '',
    status: 'started',
    username: '',
    password: '',
    tokenExpired: false,
    consoleHost: 'localhost',
    consolePort: 3080,
    compute: vi.fn(),
    cpuUsagePercent: 0,
    memoryUsagePercent: 0,
    ...partial,
  } as Controller;
}

/**
 * Helper function to create mock Role
 */
function createMockRole(partial?: Partial<Role>): Role {
  return {
    name: 'Admin',
    role_id: 'admin-role',
    builtin: true,
    ...partial,
  } as Role;
}

/**
 * Helper function to create mock ActivatedRouteSnapshot
 */
function createMockRouteSnapshot(params: Record<string, string>): ActivatedRouteSnapshot {
  return {
    paramMap: {
      get: (key: string) => params[key] || null,
    },
  } as any;
}

describe('RoleDetailResolver', () => {
  let resolver: RoleDetailResolver;
  let mockControllerService: any;
  let mockRoleService: any;
  let mockController: Controller;
  let mockRole: Role;

  beforeEach(() => {
    // Mock ControllerService
    mockControllerService = {
      get: vi.fn(),
    };

    // Mock RoleService
    mockRoleService = {
      getById: vi.fn(),
    };

    // Create mock data
    mockController = createMockController();
    mockRole = createMockRole();

    // Initialize resolver with mocks
    resolver = new RoleDetailResolver(mockControllerService, mockRoleService);
  });

  describe('Resolver Creation', () => {
    it('should create the resolver', () => {
      expect(resolver).toBeTruthy();
    });

    it('should be instance of RoleDetailResolver', () => {
      expect(resolver).toBeInstanceOf(RoleDetailResolver);
    });
  });

  describe('resolve', () => {
    describe('successful resolution', () => {
      it.each([
        ['1', 'role-1', 'numeric controller ID'],
        ['123', 'role-456', 'large numeric IDs'],
        ['5', 'admin', 'string role ID'],
      ])(
        'should resolve role for controller_id=%s, role_id=%s (%s)',
        async (controllerId: string, roleId: string, _description: string) => {
          // Arrange
          const mockRoute = createMockRouteSnapshot({
            controller_id: controllerId,
            role_id: roleId,
          });
          const mockState = {} as RouterStateSnapshot;

          mockControllerService.get.mockResolvedValue(mockController);
          mockRoleService.getById.mockReturnValue(of(mockRole));

          // Act
          const result = resolver.resolve(mockRoute, mockState);

          // Assert
          await new Promise<void>((resolve) => {
            result.subscribe({
              next: (role: Role) => {
                expect(role).toEqual(mockRole);
                resolve();
              },
            });
          });

          expect(mockControllerService.get).toHaveBeenCalledWith(+controllerId);
          expect(mockRoleService.getById).toHaveBeenCalledWith(mockController, roleId);
        }
      );
    });

    describe('parameter extraction', () => {
      it('should extract controller_id from route params', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '42', role_id: 'role-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockRoleService.getById.mockReturnValue(of(mockRole));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              expect(mockControllerService.get).toHaveBeenCalledWith(42);
              resolve();
            },
          });
        });
      });

      it('should extract role_id from route params', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', role_id: 'test-role' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockRoleService.getById.mockReturnValue(of(mockRole));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              expect(mockRoleService.getById).toHaveBeenCalledWith(mockController, 'test-role');
              resolve();
            },
          });
        });
      });
    });

    describe('service integration', () => {
      it('should call controllerService.get with parsed controller ID', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '123', role_id: 'role-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockRoleService.getById.mockReturnValue(of(mockRole));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              expect(mockControllerService.get).toHaveBeenCalledTimes(1);
              expect(mockControllerService.get).toHaveBeenCalledWith(123);
              resolve();
            },
          });
        });
      });

      it('should call roleService.getById with controller and role ID', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', role_id: 'admin' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockRoleService.getById.mockReturnValue(of(mockRole));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              expect(mockRoleService.getById).toHaveBeenCalledTimes(1);
              expect(mockRoleService.getById).toHaveBeenCalledWith(mockController, 'admin');
              resolve();
            },
          });
        });
      });
    });

    describe('error handling', () => {
      it('should handle controllerService.get errors', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', role_id: 'role-1' });
        const mockState = {} as RouterStateSnapshot;

        const error = new Error('Controller not found');
        mockControllerService.get.mockRejectedValue(error);

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              // Should not reach here
              expect(false).toBe(true);
              resolve();
            },
            error: (err: Error) => {
              expect(err).toEqual(error);
              resolve();
            },
          });
        });
      });

      it('should handle roleService.getById errors', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', role_id: 'role-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);

        // Create an observable that errors
        const errorObservable = new Observable((observer) => {
          observer.error(new Error('Role not found'));
        });
        mockRoleService.getById.mockReturnValue(errorObservable);

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              // Should not reach here
              expect(false).toBe(true);
              resolve();
            },
            error: (err: Error) => {
              expect(err.message).toBe('Role not found');
              resolve();
            },
          });
        });
      });

      it('should handle both controller and role service errors', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', role_id: 'role-1' });
        const mockState = {} as RouterStateSnapshot;

        const error = new Error('Service unavailable');
        mockControllerService.get.mockRejectedValue(error);

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              // Should not reach here
              expect(false).toBe(true);
              resolve();
            },
            error: (err: Error) => {
              expect(err).toEqual(error);
              resolve();
            },
          });
        });
      });
    });

    describe('edge cases', () => {
      it('should handle non-numeric controller_id', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: 'abc', role_id: 'role-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockRoleService.getById.mockReturnValue(of(mockRole));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              // +('abc') = NaN, but service should handle it
              expect(mockControllerService.get).toHaveBeenCalledWith(NaN);
              resolve();
            },
          });
        });
      });

      it('should handle missing controller_id parameter', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: null, role_id: 'role-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockRoleService.getById.mockReturnValue(of(mockRole));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              // +null = 0
              expect(mockControllerService.get).toHaveBeenCalledWith(0);
              resolve();
            },
          });
        });
      });

      it('should handle missing role_id parameter', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', role_id: null });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockRoleService.getById.mockReturnValue(of(mockRole));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              expect(mockRoleService.getById).toHaveBeenCalledWith(mockController, null);
              resolve();
            },
          });
        });
      });

      it('should handle empty string parameters', async () => {
        // Arrange
        // Note: paramMap.get() returns null for empty strings in Angular
        // Empty string parameters are treated as missing
        const mockRoute = createMockRouteSnapshot({ controller_id: '', role_id: '' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockRoleService.getById.mockReturnValue(of(mockRole));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              // +null = 0
              expect(mockControllerService.get).toHaveBeenCalledWith(0);
              // Empty string returns null from paramMap.get()
              expect(mockRoleService.getById).toHaveBeenCalledWith(mockController, null);
              resolve();
            },
          });
        });
      });
    });

    describe('Observable behavior', () => {
      it('should return a cold Observable that emits once', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', role_id: 'role-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockRoleService.getById.mockReturnValue(of(mockRole));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        const emissions: Role[] = [];
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: (role: Role) => {
              emissions.push(role);
            },
            complete: () => {
              expect(emissions).toHaveLength(1);
              resolve();
            },
          });
        });
      });

      it('should complete the Observable after emitting role', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', role_id: 'role-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockRoleService.getById.mockReturnValue(of(mockRole));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        let completed = false;
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {},
            complete: () => {
              completed = true;
              resolve();
            },
          });
        });

        expect(completed).toBe(true);
      });
    });

    describe('integration scenarios', () => {
      it('should handle the full happy path: get controller then get role', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '5', role_id: 'admin' });
        const mockState = {} as RouterStateSnapshot;

        const expectedController = createMockController({ id: 5, name: 'Controller-5' });
        const expectedRole = createMockRole({ name: 'Admin', role_id: 'admin' });

        mockControllerService.get.mockResolvedValue(expectedController);
        mockRoleService.getById.mockReturnValue(of(expectedRole));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: (role: Role) => {
              expect(role).toEqual(expectedRole);
              expect(mockControllerService.get).toHaveBeenCalledWith(5);
              expect(mockRoleService.getById).toHaveBeenCalledWith(expectedController, 'admin');
              resolve();
            },
          });
        });
      });

      it('should maintain call order: controllerService before roleService', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', role_id: 'role-1' });
        const mockState = {} as RouterStateSnapshot;

        let callOrder: string[] = [];
        mockControllerService.get.mockImplementation(() => {
          callOrder.push('controllerService');
          return Promise.resolve(mockController);
        });
        mockRoleService.getById.mockImplementation(() => {
          callOrder.push('roleService');
          return of(mockRole);
        });

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              expect(callOrder).toEqual(['controllerService', 'roleService']);
              resolve();
            },
          });
        });
      });
    });
  });
});
