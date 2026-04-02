import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComputeService } from './compute.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { Compute, ComputeCreate, ComputeUpdate } from '@models/compute';
import { ControllerStatistics } from '@models/computeStatistics';

describe('ComputeService', () => {
  let service: ComputeService;
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

    service = new ComputeService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of ComputeService', () => {
      expect(service).toBeInstanceOf(ComputeService);
    });
  });

  describe('getComputes', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockComputes: Compute[] = [
        { compute_id: 'comp-1', name: 'Compute 1' } as Compute,
        { compute_id: 'comp-2', name: 'Compute 2' } as Compute,
      ];

      mockHttpController.get.mockReturnValue(of(mockComputes));

      service.getComputes(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/computes');
    });

    it('should return Observable of Compute array', () => {
      const mockComputes: Compute[] = [];
      mockHttpController.get.mockReturnValue(of(mockComputes));

      const result = service.getComputes(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty computes list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getComputes(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getCompute', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockCompute: Compute = { compute_id: 'comp-1', name: 'Compute 1' } as Compute;

      mockHttpController.get.mockReturnValue(of(mockCompute));

      service.getCompute(mockController, 'comp-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/computes/comp-1');
    });

    it('should return Observable of Compute', () => {
      const mockCompute: Compute = { compute_id: 'comp-1', name: 'Compute 1' } as Compute;
      mockHttpController.get.mockReturnValue(of(mockCompute));

      const result = service.getCompute(mockController, 'comp-1');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include computeId in URL', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getCompute(mockController, 'my-compute');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/computes/my-compute');
    });
  });

  describe('createCompute', () => {
    it('should call httpController.post with correct endpoint', () => {
      const mockCompute: Compute = { compute_id: 'comp-new', name: 'New Compute' } as Compute;
      const computeData: ComputeCreate = { name: 'New Compute', host: 'localhost' } as ComputeCreate;

      mockHttpController.post.mockReturnValue(of(mockCompute));

      service.createCompute(mockController, computeData);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/computes', computeData);
    });

    it('should return Observable of Compute', () => {
      const mockCompute: Compute = { compute_id: 'comp-1', name: 'Compute 1' } as Compute;
      const computeData: ComputeCreate = { name: 'Test' } as ComputeCreate;

      mockHttpController.post.mockReturnValue(of(mockCompute));

      const result = service.createCompute(mockController, computeData);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('updateCompute', () => {
    it('should call httpController.put with correct endpoint', () => {
      const mockCompute: Compute = { compute_id: 'comp-1', name: 'Updated Compute' } as Compute;
      const computeData: ComputeUpdate = { name: 'Updated Compute' } as ComputeUpdate;

      mockHttpController.put.mockReturnValue(of(mockCompute));

      service.updateCompute(mockController, 'comp-1', computeData);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/computes/comp-1',
        computeData
      );
    });

    it('should return Observable of Compute', () => {
      const mockCompute: Compute = { compute_id: 'comp-1', name: 'Compute 1' } as Compute;
      const computeData: ComputeUpdate = { name: 'Test' } as ComputeUpdate;

      mockHttpController.put.mockReturnValue(of(mockCompute));

      const result = service.updateCompute(mockController, 'comp-1', computeData);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include computeId in URL', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.updateCompute(mockController, 'compute-to-update', {} as ComputeUpdate);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/computes/compute-to-update',
        {}
      );
    });
  });

  describe('deleteCompute', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of(undefined));

      service.deleteCompute(mockController, 'comp-1');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/computes/comp-1');
    });

    it('should return Observable', () => {
      mockHttpController.delete.mockReturnValue(of(undefined));

      const result = service.deleteCompute(mockController, 'comp-1');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include computeId in URL', () => {
      mockHttpController.delete.mockReturnValue(of(undefined));

      service.deleteCompute(mockController, 'compute-to-delete');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/computes/compute-to-delete'
      );
    });
  });

  describe('connectCompute', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of(undefined));

      service.connectCompute(mockController, 'comp-1');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/computes/comp-1/connect',
        null
      );
    });

    it('should return Observable', () => {
      mockHttpController.post.mockReturnValue(of(undefined));

      const result = service.connectCompute(mockController, 'comp-1');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should pass null as body', () => {
      mockHttpController.post.mockReturnValue(of(undefined));

      service.connectCompute(mockController, 'comp-1');

      const postCall = mockHttpController.post.mock.calls[0];
      expect(postCall[2]).toBeNull();
    });
  });

  describe('getStatistics', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockStats: ControllerStatistics = {
        cpu_usage_percent: 50.5,
        memory_usage_percent: 75.2,
      } as ControllerStatistics;

      mockHttpController.get.mockReturnValue(of(mockStats));

      service.getStatistics(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/statistics');
    });

    it('should return Observable of ControllerStatistics', () => {
      const mockStats: ControllerStatistics = {} as ControllerStatistics;
      mockHttpController.get.mockReturnValue(of(mockStats));

      const result = service.getStatistics(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('URL Construction', () => {
    it('should construct correct URL for different compute IDs', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getCompute(mockController, 'comp-alpha');
      service.getCompute(mockController, 'comp-beta');
      service.getCompute(mockController, 'comp-gamma');

      expect(mockHttpController.get).toHaveBeenCalledTimes(3);
      expect(mockHttpController.get).toHaveBeenNthCalledWith(1, mockController, '/computes/comp-alpha');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(2, mockController, '/computes/comp-beta');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(3, mockController, '/computes/comp-gamma');
    });

    it('should construct correct URLs for update and delete', () => {
      mockHttpController.put.mockReturnValue(of({}));
      mockHttpController.delete.mockReturnValue(of(undefined));

      service.updateCompute(mockController, 'comp-1', {} as ComputeUpdate);
      service.deleteCompute(mockController, 'comp-1');

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/computes/comp-1', {});
      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/computes/comp-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle compute ID with special characters', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getCompute(mockController, 'compute-with-dash');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/computes/compute-with-dash'
      );
    });

    it('should handle compute ID with underscores', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getCompute(mockController, 'compute_with_underscore');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/computes/compute_with_underscore'
      );
    });

    it('should handle empty compute data in create', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.createCompute(mockController, {} as ComputeCreate);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/computes', {});
    });

    it('should handle empty compute data in update', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.updateCompute(mockController, 'comp-1', {} as ComputeUpdate);

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/computes/comp-1', {});
    });
  });
});
