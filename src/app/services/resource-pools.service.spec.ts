import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourcePoolsService } from './resource-pools.service';
import { HttpController } from './http-controller.service';
import { ProjectService } from './project.service';
import { Observable, of, forkJoin } from 'rxjs';
import { Controller } from '@models/controller';
import { ResourcePool } from '@models/resourcePools/ResourcePool';
import { Resource } from '@models/resourcePools/Resource';
import { Project } from '@models/project';

describe('ResourcePoolsService', () => {
  let service: ResourcePoolsService;
  let mockHttpController: any;
  let mockProjectService: any;
  let mockController: Controller;

  beforeEach(() => {
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    mockProjectService = {
      list: vi.fn(),
    };

    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      status: 'running',
    } as Controller;

    service = new ResourcePoolsService(mockHttpController, mockProjectService);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of ResourcePoolsService', () => {
      expect(service).toBeInstanceOf(ResourcePoolsService);
    });
  });

  describe('getAll', () => {
    it('should call httpController.get with /pools endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getAll(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/pools');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getAll(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('get', () => {
    it('should call httpController.get for pool and resources', () => {
      const mockPool: ResourcePool = { resource_pool_id: 'pool-1', name: 'Pool 1' } as ResourcePool;
      const mockResources: Resource[] = [];
      mockHttpController.get.mockReturnValue(of(mockPool));

      service.get(mockController, 'pool-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/pools/pool-1');
      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/pools/pool-1/resources');
    });

    it('should return Observable', () => {
      const mockPool: ResourcePool = { resource_pool_id: 'pool-1', name: 'Pool 1' } as ResourcePool;
      const mockResources: Resource[] = [];
      mockHttpController.get.mockReturnValue(of(mockPool));

      const result = service.get(mockController, 'pool-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with pool ID', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'pool-1');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/pools/pool-1');
    });

    it('should return Observable', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.delete(mockController, 'pool-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('add', () => {
    it('should call httpController.post with pool name', () => {
      mockHttpController.post.mockReturnValue(of({ name: 'New Pool' }));

      service.add(mockController, 'New Pool');

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/pools', { name: 'New Pool' });
    });

    it('should return Observable', () => {
      mockHttpController.post.mockReturnValue(of({ name: 'New Pool' }));

      const result = service.add(mockController, 'New Pool');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('update', () => {
    it('should call httpController.put with pool ID and name', () => {
      const pool: ResourcePool = { resource_pool_id: 'pool-1', name: 'Updated Pool' } as ResourcePool;
      mockHttpController.put.mockReturnValue(of({}));

      service.update(mockController, pool);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/pools/pool-1',
        { name: 'Updated Pool' }
      );
    });

    it('should return Observable', () => {
      const pool: ResourcePool = { resource_pool_id: 'pool-1', name: 'Updated Pool' } as ResourcePool;
      mockHttpController.put.mockReturnValue(of({}));

      const result = service.update(mockController, pool);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('addResource', () => {
    it('should call httpController.put with pool and project IDs', () => {
      const pool: ResourcePool = { resource_pool_id: 'pool-1', name: 'Pool' } as ResourcePool;
      const project: Project = { project_id: 'proj-1', name: 'Project' } as Project;
      mockHttpController.put.mockReturnValue(of({}));

      service.addResource(mockController, pool, project);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/pools/pool-1/resources/proj-1',
        {}
      );
    });

    it('should return Observable', () => {
      const pool: ResourcePool = { resource_pool_id: 'pool-1', name: 'Pool' } as ResourcePool;
      const project: Project = { project_id: 'proj-1', name: 'Project' } as Project;
      mockHttpController.put.mockReturnValue(of({}));

      const result = service.addResource(mockController, pool, project);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('deleteResource', () => {
    it('should call httpController.delete with pool and resource IDs', () => {
      const pool: ResourcePool = { resource_pool_id: 'pool-1', name: 'Pool' } as ResourcePool;
      const resource: Resource = { resource_id: 'res-1', name: 'Resource' } as Resource;
      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteResource(mockController, resource, pool);

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/pools/pool-1/resources/res-1'
      );
    });

    it('should return Observable', () => {
      const pool: ResourcePool = { resource_pool_id: 'pool-1', name: 'Pool' } as ResourcePool;
      const resource: Resource = { resource_id: 'res-1', name: 'Resource' } as Resource;
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.deleteResource(mockController, resource, pool);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
