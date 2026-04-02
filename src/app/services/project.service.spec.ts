import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from './project.service';
import { HttpController } from './http-controller.service';
import { SettingsService } from './settings.service';
import { RecentlyOpenedProjectService } from './recentlyOpenedProject.service';
import { Observable, of, throwError, firstValueFrom } from 'rxjs';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Node } from '../cartography/models/node';
import { Link } from '@models/link';
import { Drawing } from '../cartography/models/drawing';

// Mock environment
vi.mock('environments/environment', () => ({
  environment: {
    current_version: 'v2',
  },
}));

describe('ProjectService', () => {
  let service: ProjectService;
  let mockHttpController: any;
  let mockSettingsService: any;
  let mockRecentlyOpenedProjectService: any;
  let mockController: Controller;
  let mockProject: Project;

  beforeEach(() => {
    // Mock HttpController
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getText: vi.fn(),
    };

    // Mock SettingsService
    mockSettingsService = {
      getSettings: vi.fn(),
    };

    // Mock RecentlyOpenedProjectService
    mockRecentlyOpenedProjectService = {
      removeData: vi.fn(),
    };

    // Mock Controller
    mockController = {
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
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    // Mock Project
    mockProject = {
      project_id: 'project-123',
      name: 'Test Project',
      filename: 'test.gns3',
      auto_close: true,
      auto_open: false,
      auto_start: false,
      scene_width: 2000,
      scene_height: 1000,
      zoom: 100,
      snap_to_grid: false,
      show_grid: false,
      show_interface_labels: true,
      show_layers: false,
      grid_size: 75,
      drawing_grid_size: 50,
      status: 'opened',
      readonly: false,
    } as unknown as Project;

    service = new ProjectService(
      mockHttpController,
      mockSettingsService,
      mockRecentlyOpenedProjectService
    );
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should have compression methods defined', () => {
      expect(service.compression_methods).toBeDefined();
      expect(service.compression_methods.length).toBe(5);
    });

    it('should have compression level defaults defined', () => {
      expect(service.compression_level_default_value).toBeDefined();
      expect(service.compression_level_default_value.length).toBe(5);
    });

    it('should have projectListSubject defined', () => {
      expect(service.projectListSubject).toBeDefined();
    });

    it('should have projectLockIconSubject defined', () => {
      expect(service.projectLockIconSubject).toBeDefined();
    });
  });

  describe('projectListUpdated', () => {
    it('should emit true on projectListSubject', async () => {
      const promise = new Promise<boolean>((resolve) => {
        service.projectListSubject.subscribe((value) => resolve(value));
      });

      service.projectListUpdated();

      await expect(promise).resolves.toBe(true);
    });
  });

  describe('projectUpdateLockIcon', () => {
    it('should emit true on projectLockIconSubject', async () => {
      const promise = new Promise<boolean>((resolve) => {
        service.projectLockIconSubject.subscribe((value) => resolve(value));
      });

      service.projectUpdateLockIcon();

      await expect(promise).resolves.toBe(true);
    });
  });

  describe('getReadmeFile', () => {
    it('should call httpController.getText with correct endpoint', () => {
      mockHttpController.getText.mockReturnValue(of('README content'));

      service.getReadmeFile(mockController, 'project-123');

      expect(mockHttpController.getText).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/files/README.txt'
      );
    });

    it('should return Observable that emits README content', async () => {
      mockHttpController.getText.mockReturnValue(of('README content'));

      const content = await firstValueFrom(service.getReadmeFile(mockController, 'project-123'));

      expect(content).toBe('README content');
    });

    it('should handle error when API fails', async () => {
      const error = new Error('Network error');
      mockHttpController.getText.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getReadmeFile(mockController, 'project-123'))).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('postReadmeFile', () => {
    it('should call httpController.post with correct endpoint and content', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.postReadmeFile(mockController, 'project-123', 'New README');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/files/README.txt',
        'New README'
      );
    });

    it('should return Observable that emits response', async () => {
      const mockResponse = { success: true };
      mockHttpController.post.mockReturnValue(of(mockResponse));

      const response = await firstValueFrom(
        service.postReadmeFile(mockController, 'project-123', 'Content')
      );

      expect(response).toEqual(mockResponse);
    });

    it('should handle error when API fails', async () => {
      const error = new Error('Server error');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.postReadmeFile(mockController, 'project-123', 'Content'))
      ).rejects.toThrow('Server error');
    });
  });

  describe('get', () => {
    it('should call httpController.get with correct endpoint', () => {
      mockHttpController.get.mockReturnValue(of(mockProject));

      service.get(mockController, 'project-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/projects/project-123');
    });

    it('should return Observable that emits Project', async () => {
      mockHttpController.get.mockReturnValue(of(mockProject));

      const project = await firstValueFrom(service.get(mockController, 'project-123'));

      expect(project.project_id).toBe('project-123');
      expect(project.name).toBe('Test Project');
    });

    it('should handle error when project not found', async () => {
      const error = new Error('Project not found');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.get(mockController, 'nonexistent'))).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('open', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      service.open(mockController, 'project-123');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/open',
        {}
      );
    });

    it('should return Observable that emits Project', async () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      const project = await firstValueFrom(service.open(mockController, 'project-123'));

      expect(project.status).toBe('opened');
    });

    it('should handle error when open fails', async () => {
      const error = new Error('Open failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.open(mockController, 'project-123'))).rejects.toThrow(
        'Open failed'
      );
    });
  });

  describe('close', () => {
    it('should call recentlyOpenedProjectService.removeData', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      service.close(mockController, 'project-123');

      expect(mockRecentlyOpenedProjectService.removeData).toHaveBeenCalled();
    });

    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      service.close(mockController, 'project-123');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/close',
        {}
      );
    });

    it('should return Observable that emits Project', async () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      const project = await firstValueFrom(service.close(mockController, 'project-123'));

      expect(project).toEqual(mockProject);
    });

    it('should handle error when close fails', async () => {
      const error = new Error('Close failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.close(mockController, 'project-123'))).rejects.toThrow(
        'Close failed'
      );
    });
  });

  describe('list', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockProjects: Project[] = [mockProject];
      mockHttpController.get.mockReturnValue(of(mockProjects));

      service.list(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/projects');
    });

    it('should return Observable that emits Project array', async () => {
      const mockProjects: Project[] = [mockProject];
      mockHttpController.get.mockReturnValue(of(mockProjects));

      const projects = await firstValueFrom(service.list(mockController));

      expect(projects).toHaveLength(1);
      expect(projects[0].project_id).toBe('project-123');
    });

    it.each([
      { scenario: 'empty project list', projects: [] },
      {
        scenario: 'multiple projects',
        projects: [mockProject, { ...mockProject, project_id: 'project-456' } as Project],
      },
    ])('should handle $scenario', async ({ projects }) => {
      mockHttpController.get.mockReturnValue(of(projects));

      const result = await firstValueFrom(service.list(mockController));

      expect(result).toHaveLength(projects.length);
    });

    it('should handle error when listing projects fails', async () => {
      const error = new Error('List failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.list(mockController))).rejects.toThrow('List failed');
    });
  });

  describe('nodes', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockNodes: Node[] = [];
      mockHttpController.get.mockReturnValue(of(mockNodes));

      service.nodes(mockController, 'project-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes'
      );
    });

    it('should return Observable that emits Node array', async () => {
      const mockNodes: Node[] = [{ node_id: 'node-1', name: 'Router' } as Node];
      mockHttpController.get.mockReturnValue(of(mockNodes));

      const nodes = await firstValueFrom(service.nodes(mockController, 'project-123'));

      expect(nodes).toHaveLength(1);
      expect(nodes[0].name).toBe('Router');
    });

    it('should handle error when fetching nodes fails', async () => {
      const error = new Error('Nodes fetch failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.nodes(mockController, 'project-123'))
      ).rejects.toThrow('Nodes fetch failed');
    });
  });

  describe('links', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockLinks: Link[] = [];
      mockHttpController.get.mockReturnValue(of(mockLinks));

      service.links(mockController, 'project-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/links'
      );
    });

    it('should return Observable that emits Link array', async () => {
      const mockLinks: Link[] = [{ link_id: 'link-1' } as Link];
      mockHttpController.get.mockReturnValue(of(mockLinks));

      const links = await firstValueFrom(service.links(mockController, 'project-123'));

      expect(links).toHaveLength(1);
      expect(links[0].link_id).toBe('link-1');
    });

    it('should handle error when fetching links fails', async () => {
      const error = new Error('Links fetch failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.links(mockController, 'project-123'))
      ).rejects.toThrow('Links fetch failed');
    });
  });

  describe('drawings', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockDrawings: Drawing[] = [];
      mockHttpController.get.mockReturnValue(of(mockDrawings));

      service.drawings(mockController, 'project-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/drawings'
      );
    });

    it('should return Observable that emits Drawing array', async () => {
      const mockDrawings: Drawing[] = [{ drawing_id: 'drawing-1' } as Drawing];
      mockHttpController.get.mockReturnValue(of(mockDrawings));

      const drawings = await firstValueFrom(service.drawings(mockController, 'project-123'));

      expect(drawings).toHaveLength(1);
      expect(drawings[0].drawing_id).toBe('drawing-1');
    });

    it('should handle error when fetching drawings fails', async () => {
      const error = new Error('Drawings fetch failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.drawings(mockController, 'project-123'))
      ).rejects.toThrow('Drawings fetch failed');
    });
  });

  describe('add', () => {
    it('should call httpController.post with correct endpoint and payload', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      service.add(mockController, 'New Project', 'project-new');

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/projects', {
        name: 'New Project',
        project_id: 'project-new',
      });
    });

    it('should return Observable that emits Project', async () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      const project = await firstValueFrom(service.add(mockController, 'Test', 'test-id'));

      expect(project.project_id).toBe('project-123');
    });

    it('should handle error when add fails', async () => {
      const error = new Error('Add failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.add(mockController, 'Test', 'test-id'))
      ).rejects.toThrow('Add failed');
    });
  });

  describe('update', () => {
    it('should call httpController.put with correct endpoint and payload', () => {
      mockHttpController.put.mockReturnValue(of(mockProject));

      service.update(mockController, mockProject);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123',
        expect.objectContaining({
          auto_close: true,
          auto_open: false,
          auto_start: false,
          name: 'Test Project',
          scene_width: 2000,
          scene_height: 1000,
          snap_to_grid: false,
          show_interface_labels: true,
        })
      );
    });

    it('should include all required properties in payload', () => {
      mockHttpController.put.mockReturnValue(of(mockProject));

      service.update(mockController, mockProject);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.auto_close).toBe(true);
      expect(payload.auto_open).toBe(false);
      expect(payload.auto_start).toBe(false);
      expect(payload.name).toBe('Test Project');
      expect(payload.scene_width).toBe(2000);
      expect(payload.scene_height).toBe(1000);
      expect(payload.snap_to_grid).toBe(false);
      expect(payload.show_interface_labels).toBe(true);
      expect(payload.drawing_grid_size).toBe(50);
      expect(payload.grid_size).toBe(75);
    });

    it('should return Observable that emits updated Project', async () => {
      mockHttpController.put.mockReturnValue(of(mockProject));

      const project = await firstValueFrom(service.update(mockController, mockProject));

      expect(project.project_id).toBe('project-123');
    });

    it('should handle error when update fails', async () => {
      const error = new Error('Update failed');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.update(mockController, mockProject))
      ).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'project-123');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/projects/project-123');
    });

    it('should return Observable', async () => {
      mockHttpController.delete.mockReturnValue(of({ success: true }));

      const response = await firstValueFrom(service.delete(mockController, 'project-123'));

      expect(response).toEqual({ success: true });
    });

    it('should handle error when delete fails', async () => {
      const error = new Error('Delete failed');
      mockHttpController.delete.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.delete(mockController, 'project-123'))
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('getUploadPath', () => {
    it('should construct correct upload URL', () => {
      const result = service.getUploadPath(mockController, 'uuid-123', 'My Project');

      expect(result).toBe('http://localhost:3080/v2/projects/uuid-123/import?name=My Project');
    });

    it('should handle special characters in project name', () => {
      const result = service.getUploadPath(mockController, 'uuid-123', 'Project & Test');

      expect(result).toContain('name=Project & Test');
    });

    it('should use https protocol for https controller', () => {
      const httpsController = { ...mockController, protocol: 'https:' as any };

      const result = service.getUploadPath(httpsController, 'uuid-123', 'Test');

      expect(result).toContain('https://');
    });
  });

  describe('getExportPath', () => {
    it('should construct correct export URL', () => {
      const result = service.getExportPath(mockController, mockProject);

      expect(result).toBe('http://localhost:3080/v2/projects/project-123/export');
    });

    it('should include project_id in URL', () => {
      const testProject = { ...mockProject, project_id: 'test-export' };
      const result = service.getExportPath(mockController, testProject);

      expect(result).toContain('/projects/test-export/export');
    });
  });

  describe('export', () => {
    it('should call httpController.get with correct endpoint', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.export(mockController, 'project-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/export'
      );
    });

    it('should return Observable', async () => {
      mockHttpController.get.mockReturnValue(of({ exported: true }));

      const response = await firstValueFrom(service.export(mockController, 'project-123'));

      expect(response).toEqual({ exported: true });
    });

    it('should handle error when export fails', async () => {
      const error = new Error('Export failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.export(mockController, 'project-123'))
      ).rejects.toThrow('Export failed');
    });
  });

  describe('getStatistics', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockStats = { nodes: 5, links: 3, drawings: 2 };
      mockHttpController.get.mockReturnValue(of(mockStats));

      service.getStatistics(mockController, 'project-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/stats'
      );
    });

    it('should return Observable that emits statistics', async () => {
      const mockStats = { nodes: 5, links: 3, drawings: 2 };
      mockHttpController.get.mockReturnValue(of(mockStats));

      const stats = await firstValueFrom(service.getStatistics(mockController, 'project-123'));

      expect(stats.nodes).toBe(5);
      expect(stats.links).toBe(3);
    });

    it('should handle error when getStatistics fails', async () => {
      const error = new Error('Stats failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.getStatistics(mockController, 'project-123'))
      ).rejects.toThrow('Stats failed');
    });
  });

  describe('duplicate', () => {
    it('should call httpController.post with correct endpoint and payload', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      service.duplicate(mockController, 'project-123', 'Copy of Project');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/duplicate',
        { name: 'Copy of Project' }
      );
    });

    it('should return Observable that emits duplicated Project', async () => {
      const duplicatedProject = { ...mockProject, name: 'Copy of Project' };
      mockHttpController.post.mockReturnValue(of(duplicatedProject));

      const project = await firstValueFrom(
        service.duplicate(mockController, 'project-123', 'Copy')
      );

      expect(project.name).toBe('Copy of Project');
    });

    it('should handle error when duplicate fails', async () => {
      const error = new Error('Duplicate failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.duplicate(mockController, 'project-123', 'Copy'))
      ).rejects.toThrow('Duplicate failed');
    });
  });

  describe('isReadOnly', () => {
    it('should return true when project is readonly', () => {
      const readonlyProject = { ...mockProject, readonly: true };

      const result = service.isReadOnly(readonlyProject);

      expect(result).toBe(true);
    });

    it('should return false when project is not readonly', () => {
      const result = service.isReadOnly(mockProject);

      expect(result).toBe(false);
    });

    it('should return false when readonly property is undefined', () => {
      const projectWithoutReadonly = { ...mockProject, readonly: undefined };

      const result = service.isReadOnly(projectWithoutReadonly);

      expect(result).toBe(false);
    });
  });

  describe('getCompression', () => {
    it('should return compression methods array', () => {
      const result = service.getCompression();

      expect(result).toEqual(service.compression_methods);
    });

    it('should have 5 compression methods', () => {
      const result = service.getCompression();

      expect(result).toHaveLength(5);
    });

    it.each([
      { value: 'none', expectedName: 'None' },
      { value: 'zip', expectedName: 'Zip compression (deflate)' },
      { value: 'bzip2', expectedName: 'Bzip2 compression' },
      { value: 'lzma', expectedName: 'Lzma compression' },
      { value: 'zstd', expectedName: 'Zstandard compression' },
    ])('should include $expectedName compression method', ({ value, expectedName }) => {
      const result = service.getCompression();

      const method = result.find((m: any) => m.value === value);
      expect(method).toBeDefined();
      expect(method.name).toBe(expectedName);
    });
  });

  describe('getCompressionLevel', () => {
    it('should return compression level defaults', () => {
      const result = service.getCompressionLevel();

      expect(result).toEqual(service.compression_level_default_value);
    });

    it('should have 5 compression level definitions', () => {
      const result = service.getCompressionLevel();

      expect(result).toHaveLength(5);
    });

    it.each([
      { name: 'none', value: '', hasSelectionValues: false },
      { name: 'zip', value: 6, hasSelectionValues: true },
      { name: 'bzip2', value: 9, hasSelectionValues: true },
      { name: 'lzma', value: ' ', hasSelectionValues: false },
      { name: 'zstd', value: 3, hasSelectionValues: true },
    ])('should have correct config for $name', ({ name, value, hasSelectionValues }) => {
      const result = service.getCompressionLevel();

      const level = result.find((l: any) => l.name === name);
      expect(level).toBeDefined();
      expect(level.value).toBe(value);
      expect(level.selectionValues.length > 0).toBe(hasSelectionValues);
    });
  });

  describe('getexportPortableProjectPath', () => {
    it('should construct URL with compression level when provided', () => {
      const formData = {
        compression: 'zip',
        compression_level: 9,
        include_snapshots: true,
        include_base_image: false,
        reset_mac_address: true,
      };

      const result = service.getexportPortableProjectPath(mockController, 'project-123', formData);

      expect(result).toContain('compression=zip');
      expect(result).toContain('compression_level=9');
      expect(result).toContain('include_snapshots=true');
      expect(result).toContain('include_images=false');
      expect(result).toContain('reset_mac_addresses=true');
    });

    it('should construct URL without compression level when not provided', () => {
      const formData = {
        compression: 'none',
        compression_level: '',
        include_snapshots: true,
        include_base_image: false,
        reset_mac_address: false,
      };

      const result = service.getexportPortableProjectPath(mockController, 'project-123', formData);

      expect(result).not.toContain('compression_level=');
      expect(result).toContain('compression=none');
    });

    it('should include auth token in URL', () => {
      const formData = {
        compression: 'zip',
        compression_level: 6,
        include_snapshots: false,
        include_base_image: false,
        reset_mac_address: false,
      };

      const result = service.getexportPortableProjectPath(mockController, 'project-123', formData);

      expect(result).toContain('token=test-token');
    });
  });

  describe('getProjectStatus', () => {
    it('should call get with locked endpoint', () => {
      mockHttpController.get.mockReturnValue(of({ locked: false }));

      service.getProjectStatus(mockController, 'project-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/locked'
      );
    });

    it('should return Observable that emits locked status', async () => {
      mockHttpController.get.mockReturnValue(of({ locked: true }));

      const status = await firstValueFrom(service.getProjectStatus(mockController, 'project-123'));

      expect(status.locked).toBe(true);
    });

    it('should handle error when getProjectStatus fails', async () => {
      const error = new Error('Status check failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.getProjectStatus(mockController, 'project-123'))
      ).rejects.toThrow('Status check failed');
    });
  });

  describe('URL Construction', () => {
    it.each([
      { projectId: 'proj-alpha', expectedPath: '/projects/proj-alpha' },
      { projectId: 'proj-beta', expectedPath: '/projects/proj-beta' },
      { projectId: 'proj-gamma', expectedPath: '/projects/proj-gamma' },
    ])('should construct correct URL for project $projectId', ({ projectId, expectedPath }) => {
      mockHttpController.get.mockReturnValue(of({}));

      service.get(mockController, projectId);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, expectedPath);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty project name in add', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      service.add(mockController, '', 'project-123');

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/projects', {
        name: '',
        project_id: 'project-123',
      });
    });

    it('should handle special characters in project name', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      service.add(mockController, 'Project & Test', 'project-123');

      expect(mockHttpController.post).toHaveBeenCalled();
    });

    it('should handle project_id with special characters', () => {
      mockHttpController.get.mockReturnValue(of(mockProject));

      service.get(mockController, 'project-with-dash');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-with-dash'
      );
    });

    it.each([
      { method: 'nodes', expectedEndpoint: '/projects/project-123/nodes' },
      { method: 'links', expectedEndpoint: '/projects/project-123/links' },
      { method: 'drawings', expectedEndpoint: '/projects/project-123/drawings' },
    ])('should return Observable for $method with empty array', ({ method, expectedEndpoint }) => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = (service as any)[method](mockController, 'project-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, expectedEndpoint);
      expect(result).toBeInstanceOf(Observable);
    });
  });
});
