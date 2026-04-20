import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourcePoolsResolver } from './resource-pools.resolver';
import { ControllerService } from '@services/controller.service';
import { ResourcePoolsService } from '@services/resource-pools.service';
import { Controller } from '@models/controller';
import { ResourcePool } from '@models/resourcePools/ResourcePool';
import { of, Observable } from 'rxjs';
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
 * Helper function to create mock ResourcePool
 */
function createMockResourcePool(partial?: Partial<ResourcePool>): ResourcePool {
  return {
    resource_pool_id: 'pool-1',
    name: 'Test Pool',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...partial,
  };
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

describe('ResourcePoolsResolver', () => {
  let resolver: ResourcePoolsResolver;
  let mockControllerService: any;
  let mockResourcePoolsService: any;
  let mockController: Controller;
  let mockResourcePool: ResourcePool;

  beforeEach(() => {
    // Mock ControllerService
    mockControllerService = {
      get: vi.fn(),
    };

    // Mock ResourcePoolsService
    mockResourcePoolsService = {
      get: vi.fn(),
    };

    // Create mock data
    mockController = createMockController();
    mockResourcePool = createMockResourcePool();

    // Initialize resolver with mocks
    resolver = new ResourcePoolsResolver(mockControllerService, mockResourcePoolsService);
  });

  describe('Resolver Creation', () => {
    it('should create the resolver', () => {
      expect(resolver).toBeTruthy();
    });

    it('should be instance of ResourcePoolsResolver', () => {
      expect(resolver).toBeInstanceOf(ResourcePoolsResolver);
    });
  });

  describe('resolve', () => {
    describe('successful resolution', () => {
      it.each([
        ['1', 'pool-1', 'numeric controller ID'],
        ['123', 'pool-456', 'large numeric IDs'],
        ['5', 'default-pool', 'string pool ID'],
      ])(
        'should resolve resource pool for controller_id=%s, pool_id=%s (%s)',
        async (controllerId: string, poolId: string, _description: string) => {
          // Arrange
          const mockRoute = createMockRouteSnapshot({
            controller_id: controllerId,
            pool_id: poolId,
          });
          const mockState = {} as RouterStateSnapshot;

          mockControllerService.get.mockResolvedValue(mockController);
          mockResourcePoolsService.get.mockReturnValue(of(mockResourcePool));

          // Act
          const result = resolver.resolve(mockRoute, mockState);

          // Assert
          await new Promise<void>((resolve) => {
            result.subscribe({
              next: (pool: ResourcePool) => {
                expect(pool).toEqual(mockResourcePool);
                resolve();
              },
            });
          });

          expect(mockControllerService.get).toHaveBeenCalledWith(+controllerId);
          expect(mockResourcePoolsService.get).toHaveBeenCalledWith(mockController, poolId);
        }
      );
    });

    describe('parameter extraction', () => {
      it('should extract controller_id from route params', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '42', pool_id: 'pool-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockResourcePoolsService.get.mockReturnValue(of(mockResourcePool));

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

      it('should extract pool_id from route params', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', pool_id: 'test-pool' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockResourcePoolsService.get.mockReturnValue(of(mockResourcePool));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              expect(mockResourcePoolsService.get).toHaveBeenCalledWith(mockController, 'test-pool');
              resolve();
            },
          });
        });
      });
    });

    describe('service integration', () => {
      it('should call controllerService.get with parsed controller ID', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '123', pool_id: 'pool-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockResourcePoolsService.get.mockReturnValue(of(mockResourcePool));

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

      it('should call resourcePoolsService.get with controller and pool ID', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', pool_id: 'main-pool' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockResourcePoolsService.get.mockReturnValue(of(mockResourcePool));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              expect(mockResourcePoolsService.get).toHaveBeenCalledTimes(1);
              expect(mockResourcePoolsService.get).toHaveBeenCalledWith(mockController, 'main-pool');
              resolve();
            },
          });
        });
      });
    });

    describe('error handling', () => {
      it('should handle controllerService.get errors', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', pool_id: 'pool-1' });
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

      it('should handle resourcePoolsService.get errors', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', pool_id: 'pool-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);

        // Create an observable that errors
        const errorObservable = new Observable((observer) => {
          observer.error(new Error('Resource pool not found'));
        });
        mockResourcePoolsService.get.mockReturnValue(errorObservable);

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
              expect(err.message).toBe('Resource pool not found');
              resolve();
            },
          });
        });
      });

      it('should handle both controller and pool service errors', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', pool_id: 'pool-1' });
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
        const mockRoute = createMockRouteSnapshot({ controller_id: 'abc', pool_id: 'pool-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockResourcePoolsService.get.mockReturnValue(of(mockResourcePool));

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
        const mockRoute = createMockRouteSnapshot({ controller_id: null, pool_id: 'pool-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockResourcePoolsService.get.mockReturnValue(of(mockResourcePool));

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

      it('should handle missing pool_id parameter', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', pool_id: null });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockResourcePoolsService.get.mockReturnValue(of(mockResourcePool));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              expect(mockResourcePoolsService.get).toHaveBeenCalledWith(mockController, null);
              resolve();
            },
          });
        });
      });

      it('should handle empty string parameters', async () => {
        // Arrange
        // Note: paramMap.get() returns null for empty strings in Angular
        // Empty string parameters are treated as missing
        const mockRoute = createMockRouteSnapshot({ controller_id: '', pool_id: '' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockResourcePoolsService.get.mockReturnValue(of(mockResourcePool));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              // +null = 0
              expect(mockControllerService.get).toHaveBeenCalledWith(0);
              // Empty string returns null from paramMap.get()
              expect(mockResourcePoolsService.get).toHaveBeenCalledWith(mockController, null);
              resolve();
            },
          });
        });
      });
    });

    describe('Observable behavior', () => {
      it('should return a cold Observable that emits once', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', pool_id: 'pool-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockResourcePoolsService.get.mockReturnValue(of(mockResourcePool));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        const emissions: ResourcePool[] = [];
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: (pool: ResourcePool) => {
              emissions.push(pool);
            },
            complete: () => {
              expect(emissions).toHaveLength(1);
              resolve();
            },
          });
        });
      });

      it('should complete the Observable after emitting resource pool', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', pool_id: 'pool-1' });
        const mockState = {} as RouterStateSnapshot;

        mockControllerService.get.mockResolvedValue(mockController);
        mockResourcePoolsService.get.mockReturnValue(of(mockResourcePool));

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
      it('should handle the full happy path: get controller then get resource pool', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '5', pool_id: 'main' });
        const mockState = {} as RouterStateSnapshot;

        const expectedController = createMockController({ id: 5, name: 'Controller-5' });
        const expectedPool = createMockResourcePool({ resource_pool_id: 'main', name: 'Main Pool' });

        mockControllerService.get.mockResolvedValue(expectedController);
        mockResourcePoolsService.get.mockReturnValue(of(expectedPool));

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: (pool: ResourcePool) => {
              expect(pool).toEqual(expectedPool);
              expect(mockControllerService.get).toHaveBeenCalledWith(5);
              expect(mockResourcePoolsService.get).toHaveBeenCalledWith(expectedController, 'main');
              resolve();
            },
          });
        });
      });

      it('should maintain call order: controllerService before resourcePoolsService', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1', pool_id: 'pool-1' });
        const mockState = {} as RouterStateSnapshot;

        let callOrder: string[] = [];
        mockControllerService.get.mockImplementation(() => {
          callOrder.push('controllerService');
          return Promise.resolve(mockController);
        });
        mockResourcePoolsService.get.mockImplementation(() => {
          callOrder.push('resourcePoolsService');
          return of(mockResourcePool);
        });

        // Act
        const result = resolver.resolve(mockRoute, mockState);

        // Assert
        await new Promise<void>((resolve) => {
          result.subscribe({
            next: () => {
              expect(callOrder).toEqual(['controllerService', 'resourcePoolsService']);
              resolve();
            },
          });
        });
      });
    });
  });
});
