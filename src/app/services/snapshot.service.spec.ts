import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SnapshotService } from './snapshot.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { Snapshot } from '@models/snapshot';

describe('SnapshotService', () => {
  let service: SnapshotService;
  let mockHttpController: any;
  let mockController: Controller;

  beforeEach(() => {
    // Mock HttpController
    mockHttpController = {
      post: vi.fn(),
      get: vi.fn(),
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

    service = new SnapshotService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be created with HttpController', () => {
      expect(service).toBeInstanceOf(SnapshotService);
    });
  });

  describe('create', () => {
    it('should call httpController.post with correct URL', () => {
      const mockSnapshot: Snapshot = {
        snapshot_id: 'snap-1',
        name: 'Test Snapshot',
        project_id: 'project-1',
        created_at: 1234567890,
      };

      mockHttpController.post.mockReturnValue(of(mockSnapshot));

      service.create(mockController, 'project-1', mockSnapshot);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/snapshots',
        mockSnapshot
      );
    });

    it('should return Observable from httpController', async () => {
      const mockSnapshot: Snapshot = {
        snapshot_id: 'snap-1',
        name: 'Test Snapshot',
        project_id: 'project-1',
        created_at: 1234567890,
      };

      mockHttpController.post.mockReturnValue(of(mockSnapshot));

      const result = service.create(mockController, 'project-1', mockSnapshot);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should pass snapshot data to httpController', () => {
      const mockSnapshot: Snapshot = {
        snapshot_id: 'snap-1',
        name: 'Test Snapshot',
        project_id: 'project-1',
        created_at: 1234567890,
      };

      mockHttpController.post.mockReturnValue(of(mockSnapshot));

      service.create(mockController, 'project-1', mockSnapshot);

      expect(mockHttpController.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with correct URL', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'project-1', 'snap-1');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/snapshots/snap-1'
      );
    });

    it('should return Observable from httpController', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.delete(mockController, 'project-1', 'snap-1');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include snapshot_id in URL', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'project-2', 'snap-123');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/project-2/snapshots/snap-123'
      );
    });
  });

  describe('list', () => {
    it('should call httpController.get with correct URL', () => {
      const mockSnapshots: Snapshot[] = [
        { snapshot_id: 'snap-1', name: 'Snapshot 1', project_id: 'project-1', created_at: 1234567890 },
        { snapshot_id: 'snap-2', name: 'Snapshot 2', project_id: 'project-1', created_at: 1234567891 },
      ];

      mockHttpController.get.mockReturnValue(of(mockSnapshots));

      service.list(mockController, 'project-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/snapshots'
      );
    });

    it('should return Observable of Snapshot array', async () => {
      const mockSnapshots: Snapshot[] = [
        { snapshot_id: 'snap-1', name: 'Snapshot 1', project_id: 'project-1', created_at: 1234567890 },
      ];

      mockHttpController.get.mockReturnValue(of(mockSnapshots));

      const result = service.list(mockController, 'project-1');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty snapshot list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.list(mockController, 'project-1');

      expect(result).toBeInstanceOf(Observable);
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/snapshots'
      );
    });
  });

  describe('restore', () => {
    it('should call httpController.post with correct URL', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.restore(mockController, 'project-1', 'snap-1');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/snapshots/snap-1/restore',
        {}
      );
    });

    it('should pass empty body as second parameter', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.restore(mockController, 'project-2', 'snap-5');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-2/snapshots/snap-5/restore',
        {}
      );
    });

    it('should return Observable from httpController', () => {
      mockHttpController.post.mockReturnValue(of({}));

      const result = service.restore(mockController, 'project-1', 'snap-1');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include snapshot_id in restore URL', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.restore(mockController, 'project-1', 'snap-999');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/snapshots/snap-999/restore',
        {}
      );
    });
  });

  describe('URL Construction', () => {
    it('should construct correct URL for different project IDs', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.list(mockController, 'proj-alpha');
      service.list(mockController, 'proj-beta');
      service.list(mockController, 'proj-gamma');

      expect(mockHttpController.get).toHaveBeenCalledTimes(3);
      expect(mockHttpController.get).toHaveBeenNthCalledWith(1, mockController, '/projects/proj-alpha/snapshots');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(2, mockController, '/projects/proj-beta/snapshots');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(3, mockController, '/projects/proj-gamma/snapshots');
    });

    it('should construct correct URL for different snapshot IDs', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'proj-1', 'snap-a');
      service.delete(mockController, 'proj-1', 'snap-b');

      expect(mockHttpController.delete).toHaveBeenNthCalledWith(1, mockController, '/projects/proj-1/snapshots/snap-a');
      expect(mockHttpController.delete).toHaveBeenNthCalledWith(2, mockController, '/projects/proj-1/snapshots/snap-b');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in project_id', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.list(mockController, 'project-with-dash');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-with-dash/snapshots'
      );
    });

    it('should handle special characters in snapshot_id', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'proj-1', 'snap-with_underscore');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/proj-1/snapshots/snap-with_underscore'
      );
    });

    it('should handle empty snapshot_id', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'proj-1', '');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/proj-1/snapshots/'
      );
    });
  });
});
