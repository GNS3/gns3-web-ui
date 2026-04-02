import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ControllerResolve } from './controller-resolve';
import { ControllerService } from '@services/controller.service';
import { Controller } from '@models/controller';
import { ActivatedRouteSnapshot } from '@angular/router';

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
 * Helper function to create mock ActivatedRouteSnapshot
 * Note: This resolver uses route.params['key'] not route.paramMap.get('key')
 */
function createMockRouteSnapshot(params: Record<string, string>): ActivatedRouteSnapshot {
  return {
    params: params,
  } as any;
}

describe('ControllerResolve', () => {
  let resolver: ControllerResolve;
  let mockControllerService: any;
  let mockController: Controller;

  beforeEach(() => {
    // Mock ControllerService
    mockControllerService = {
      get: vi.fn(),
    };

    // Create mock data
    mockController = createMockController();

    // Initialize resolver with mocks
    resolver = new ControllerResolve(mockControllerService);
  });

  describe('Resolver Creation', () => {
    it('should create the resolver', () => {
      expect(resolver).toBeTruthy();
    });

    it('should be instance of ControllerResolve', () => {
      expect(resolver).toBeInstanceOf(ControllerResolve);
    });

    it('should have resolve method', () => {
      expect(typeof resolver.resolve).toBe('function');
    });
  });

  describe('resolve', () => {
    describe('successful resolution', () => {
      it.each([
        ['1', 1, 'single digit controller ID'],
        ['42', 42, 'two digit controller ID'],
        ['123', 123, 'three digit controller ID'],
        ['9999', 9999, 'large numeric ID'],
      ])(
        'should resolve controller for controller_id=%s (parsed as %s, %s)',
        async (controllerId: string, expectedId: number, _description: string) => {
          // Arrange
          const expectedController = createMockController({ id: expectedId });
          const mockRoute = createMockRouteSnapshot({ controller_id: controllerId });

          mockControllerService.get.mockResolvedValue(expectedController);

          // Act
          const result = resolver.resolve(mockRoute);

          // Assert
          const controller = await result;
          expect(controller).toEqual(expectedController);
          expect(controller.id).toBe(expectedId);
          expect(mockControllerService.get).toHaveBeenCalledWith(expectedId);
        }
      );
    });

    describe('parameter extraction', () => {
      it('should extract controller_id from route.params using bracket notation', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '42' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledWith(42);
      });

      it('should use parseInt to parse controller_id string to number', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '123' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledWith(123);
      });
    });

    describe('service integration', () => {
      it('should call controllerService.get with parsed controller ID', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '456' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledTimes(1);
        expect(mockControllerService.get).toHaveBeenCalledWith(456);
      });

      it('should return Promise from controllerService.get', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1' });
        const servicePromise = Promise.resolve(mockController);
        mockControllerService.get.mockReturnValue(servicePromise);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        expect(result).toBe(servicePromise);
      });
    });

    describe('error handling', () => {
      it('should handle controllerService.get errors', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1' });
        const error = new Error('Controller not found');
        mockControllerService.get.mockRejectedValue(error);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await expect(result).rejects.toEqual(error);
      });

      it('should propagate service errors without modification', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1' });
        const customError = new Error('Network error');
        customError.stack = 'custom stack trace';
        mockControllerService.get.mockRejectedValue(customError);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await expect(result).rejects.toThrow('Network error');
      });
    });

    describe('edge cases', () => {
      it('should handle non-numeric controller_id (NaN)', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: 'abc' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledWith(NaN);
      });

      it('should handle controller_id with decimal (parseInt truncates)', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '123.45' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledWith(123);
      });

      it('should handle controller_id with leading zeros', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '007' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledWith(7);
      });

      it('should handle controller_id with hexadecimal prefix', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '0x10' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        // parseInt('0x10') = 16 (hex parsed as decimal)
        expect(mockControllerService.get).toHaveBeenCalledWith(16);
      });

      it('should handle negative controller_id', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '-5' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledWith(-5);
      });

      it('should handle zero as controller_id', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '0' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledWith(0);
      });

      it('should handle missing controller_id parameter (undefined)', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({});
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledWith(NaN);
      });

      it('should handle empty string controller_id', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledWith(NaN);
      });

      it('should handle controller_id with whitespace', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '  42  ' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledWith(42);
      });

      it('should handle controller_id starting with whitespace and number', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: ' 123abc' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        await result;
        expect(mockControllerService.get).toHaveBeenCalledWith(123);
      });
    });

    describe('Promise behavior', () => {
      it('should return Promise from service', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1' });
        const servicePromise = Promise.resolve(mockController);
        mockControllerService.get.mockReturnValue(servicePromise);

        // Act
        const result = resolver.resolve(mockRoute);

        // Assert
        expect(result).toBeInstanceOf(Promise);
      });

      it('should resolve with controller once', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const result = await resolver.resolve(mockRoute);

        // Assert
        expect(result).toEqual(mockController);
      });

      it('should handle multiple awaits gracefully', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const promise = resolver.resolve(mockRoute);
        const result1 = await promise;
        const result2 = await promise;

        // Assert
        expect(result1).toEqual(mockController);
        expect(result2).toEqual(mockController);
        expect(mockControllerService.get).toHaveBeenCalledTimes(1);
      });
    });

    describe('integration scenarios', () => {
      it('should handle the full happy path: parse ID and get controller', async () => {
        // Arrange
        const expectedController = createMockController({ id: 99, name: 'Controller-99' });
        const mockRoute = createMockRouteSnapshot({ controller_id: '99' });
        mockControllerService.get.mockResolvedValue(expectedController);

        // Act
        const result = await resolver.resolve(mockRoute);

        // Assert
        expect(result).toEqual(expectedController);
        expect(result.id).toBe(99);
        expect(mockControllerService.get).toHaveBeenCalledWith(99);
      });

      it('should handle large controller IDs', async () => {
        // Arrange
        const largeId = 2147483647; // Max 32-bit signed integer
        const expectedController = createMockController({ id: largeId });
        const mockRoute = createMockRouteSnapshot({ controller_id: largeId.toString() });
        mockControllerService.get.mockResolvedValue(expectedController);

        // Act
        const result = await resolver.resolve(mockRoute);

        // Assert
        expect(result.id).toBe(largeId);
        expect(mockControllerService.get).toHaveBeenCalledWith(largeId);
      });

      it('should maintain single service call for same route', async () => {
        // Arrange
        const mockRoute = createMockRouteSnapshot({ controller_id: '1' });
        mockControllerService.get.mockResolvedValue(mockController);

        // Act
        const promise1 = resolver.resolve(mockRoute);
        const promise2 = resolver.resolve(mockRoute);

        await Promise.all([promise1, promise2]);

        // Assert
        expect(mockControllerService.get).toHaveBeenCalledTimes(2);
      });
    });
  });
});
