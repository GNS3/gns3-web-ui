import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';
import { SnapshotService } from './snapshot.service';
import { HttpController } from './http-controller.service';
import { Controller } from '@models/controller';
import { Snapshot } from '@models/snapshot';

describe('SnapshotService', () => {
  let service: SnapshotService;
  let mockHttpController: any;
  let mockController: Controller;

  const createMockController = (): Controller =>
    ({
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
    } as Controller);

  beforeEach(() => {
    mockHttpController = {
      post: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    };
    mockController = createMockController();
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
    const mockSnapshot = (): Snapshot => ({
      snapshot_id: 'snap-1',
      name: 'Test Snapshot',
      project_id: 'project-1',
      created_at: 1234567890,
    });

    it('should call httpController.post with correct URL and data', async () => {
      const snapshot = mockSnapshot();
      mockHttpController.post.mockReturnValue(of(snapshot));

      await firstValueFrom(service.create(mockController, 'project-1', snapshot));

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/projects/project-1/snapshots', snapshot);
    });

    it('should return the created snapshot', async () => {
      const snapshot = mockSnapshot();
      mockHttpController.post.mockReturnValue(of(snapshot));

      const result = await firstValueFrom(service.create(mockController, 'project-1', snapshot));

      expect(result).toEqual(snapshot);
    });

    it('should propagate error when httpController.post fails', async () => {
      const error = new Error('Server error');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.create(mockController, 'project-1', mockSnapshot()))).rejects.toThrow(
        'Server error'
      );
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with correct URL', async () => {
      mockHttpController.delete.mockReturnValue(of({}));

      await firstValueFrom(service.delete(mockController, 'project-1', 'snap-1'));

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/projects/project-1/snapshots/snap-1');
    });

    it('should return empty object on success', async () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = await firstValueFrom(service.delete(mockController, 'project-1', 'snap-1'));

      expect(result).toEqual({});
    });

    it('should propagate error when httpController.delete fails', async () => {
      const error = new Error('Delete failed');
      mockHttpController.delete.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.delete(mockController, 'project-1', 'snap-1'))).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('list', () => {
    const mockSnapshots = (): Snapshot[] => [
      { snapshot_id: 'snap-1', name: 'Snapshot 1', project_id: 'project-1', created_at: 1234567890 },
      { snapshot_id: 'snap-2', name: 'Snapshot 2', project_id: 'project-1', created_at: 1234567891 },
    ];

    it('should call httpController.get with correct URL', async () => {
      mockHttpController.get.mockReturnValue(of(mockSnapshots()));

      await firstValueFrom(service.list(mockController, 'project-1'));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/projects/project-1/snapshots');
    });

    it('should return array of snapshots', async () => {
      const snapshots = mockSnapshots();
      mockHttpController.get.mockReturnValue(of(snapshots));

      const result = await firstValueFrom(service.list(mockController, 'project-1'));

      expect(result).toEqual(snapshots);
    });

    it('should return empty array when no snapshots exist', async () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = await firstValueFrom(service.list(mockController, 'project-1'));

      expect(result).toEqual([]);
    });

    it('should propagate error when httpController.get fails', async () => {
      const error = new Error('Network error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.list(mockController, 'project-1'))).rejects.toThrow('Network error');
    });

    it.each([
      ['proj-alpha', '/projects/proj-alpha/snapshots'],
      ['proj-beta', '/projects/proj-beta/snapshots'],
      ['proj-gamma', '/projects/proj-gamma/snapshots'],
    ])('should construct correct URL for project_id %s', async (projectId, expectedUrl) => {
      mockHttpController.get.mockReturnValue(of([]));

      await firstValueFrom(service.list(mockController, projectId));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, expectedUrl);
    });
  });

  describe('restore', () => {
    it('should call httpController.post with correct URL and empty body', async () => {
      mockHttpController.post.mockReturnValue(of({}));

      await firstValueFrom(service.restore(mockController, 'project-1', 'snap-1'));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/snapshots/snap-1/restore',
        {}
      );
    });

    it('should return empty object on success', async () => {
      mockHttpController.post.mockReturnValue(of({}));

      const result = await firstValueFrom(service.restore(mockController, 'project-1', 'snap-1'));

      expect(result).toEqual({});
    });

    it('should propagate error when httpController.post fails', async () => {
      const error = new Error('Restore failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.restore(mockController, 'project-1', 'snap-1'))).rejects.toThrow(
        'Restore failed'
      );
    });

    it.each([
      ['snap-100', '/projects/project-1/snapshots/snap-100/restore'],
      ['snap-999', '/projects/project-1/snapshots/snap-999/restore'],
    ])('should construct correct restore URL for snapshot_id %s', async (snapshotId, expectedUrl) => {
      mockHttpController.post.mockReturnValue(of({}));

      await firstValueFrom(service.restore(mockController, 'project-1', snapshotId));

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, expectedUrl, {});
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in project_id', async () => {
      mockHttpController.get.mockReturnValue(of([]));

      await firstValueFrom(service.list(mockController, 'project-with-dash'));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/projects/project-with-dash/snapshots');
    });

    it('should handle special characters in snapshot_id', async () => {
      mockHttpController.delete.mockReturnValue(of({}));

      await firstValueFrom(service.delete(mockController, 'proj-1', 'snap-with_underscore'));

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/proj-1/snapshots/snap-with_underscore'
      );
    });

    it('should handle empty snapshot_id', async () => {
      mockHttpController.delete.mockReturnValue(of({}));

      await firstValueFrom(service.delete(mockController, 'proj-1', ''));

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/projects/proj-1/snapshots/');
    });

    it('should handle empty project_id', async () => {
      mockHttpController.get.mockReturnValue(of([]));

      await firstValueFrom(service.list(mockController, ''));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/projects//snapshots');
    });
  });
});
