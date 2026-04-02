import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from './project.service';
import { HttpController } from './http-controller.service';
import { SettingsService } from './settings.service';
import { RecentlyOpenedProjectService } from './recentlyOpenedProject.service';
import { Observable, of } from 'rxjs';
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
    it('should emit true on projectListSubject', () => {
      let received = false;
      service.projectListSubject.subscribe((value) => {
        received = value;
      });

      service.projectListUpdated();

      expect(received).toBe(true);
    });
  });

  describe('projectUpdateLockIcon', () => {
    it('should emit true on projectLockIconSubject', () => {
      let received = false;
      service.projectLockIconSubject.subscribe((value) => {
        received = value;
      });

      service.projectUpdateLockIcon();

      expect(received).toBe(true);
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

    it('should return Observable', () => {
      mockHttpController.getText.mockReturnValue(of('README content'));

      const result = service.getReadmeFile(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
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

    it('should return Observable', () => {
      mockHttpController.post.mockReturnValue(of({}));

      const result = service.postReadmeFile(mockController, 'project-123', 'Content');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('get', () => {
    it('should call httpController.get with correct endpoint', () => {
      mockHttpController.get.mockReturnValue(of(mockProject));

      service.get(mockController, 'project-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123'
      );
    });

    it('should return Observable of Project', () => {
      mockHttpController.get.mockReturnValue(of(mockProject));

      const result = service.get(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
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

    it('should return Observable of Project', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      const result = service.open(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
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

    it('should return Observable of Project', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      const result = service.close(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('list', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockProjects: Project[] = [mockProject];
      mockHttpController.get.mockReturnValue(of(mockProjects));

      service.list(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/projects');
    });

    it('should return Observable of Project array', () => {
      const mockProjects: Project[] = [mockProject];
      mockHttpController.get.mockReturnValue(of(mockProjects));

      const result = service.list(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty project list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.list(mockController);

      expect(result).toBeInstanceOf(Observable);
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

    it('should return Observable of Node array', () => {
      const mockNodes: Node[] = [];
      mockHttpController.get.mockReturnValue(of(mockNodes));

      const result = service.nodes(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
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

    it('should return Observable of Link array', () => {
      const mockLinks: Link[] = [];
      mockHttpController.get.mockReturnValue(of(mockLinks));

      const result = service.links(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
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

    it('should return Observable of Drawing array', () => {
      const mockDrawings: Drawing[] = [];
      mockHttpController.get.mockReturnValue(of(mockDrawings));

      const result = service.drawings(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('add', () => {
    it('should call httpController.post with correct endpoint and payload', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      service.add(mockController, 'New Project', 'project-new');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects',
        { name: 'New Project', project_id: 'project-new' }
      );
    });

    it('should return Observable', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      const result = service.add(mockController, 'Test', 'test-id');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('update', () => {
    it('should call httpController.put with correct endpoint and payload', () => {
      mockHttpController.put.mockReturnValue(of(mockProject));

      service.update(mockController, mockProject);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123',
        expect.any(Object)
      );
    });

    it('should include all project properties in payload', () => {
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
    });

    it('should return Observable of Project', () => {
      mockHttpController.put.mockReturnValue(of(mockProject));

      const result = service.update(mockController, mockProject);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'project-123');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123'
      );
    });

    it('should return Observable', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.delete(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getUploadPath', () => {
    it('should construct correct upload URL', () => {
      const result = service.getUploadPath(mockController, 'uuid-123', 'My Project');

      expect(result).toBe('http://localhost:3080/v3/projects/uuid-123/import?name=My Project');
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

      expect(result).toBe('http://localhost:3080/v3/projects/project-123/export');
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

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.export(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
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

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.getStatistics(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
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

    it('should return Observable', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      const result = service.duplicate(mockController, 'project-123', 'Copy');

      expect(result).toBeInstanceOf(Observable);
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

      expect(result.length).toBe(5);
    });

    it('should include zip compression', () => {
      const result = service.getCompression();

      const zipMethod = result.find((m: any) => m.value === 'zip');
      expect(zipMethod).toBeDefined();
      expect(zipMethod.name).toContain('Zip');
    });
  });

  describe('getCompressionLevel', () => {
    it('should return compression level defaults', () => {
      const result = service.getCompressionLevel();

      expect(result).toEqual(service.compression_level_default_value);
    });

    it('should have 5 compression level definitions', () => {
      const result = service.getCompressionLevel();

      expect(result.length).toBe(5);
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

      // get() method prepends /projects/, so the full path is constructed
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/locked'
      );
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({ locked: true }));

      const result = service.getProjectStatus(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('URL Construction', () => {
    it('should construct correct URL for different project IDs', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.get(mockController, 'proj-alpha');
      service.get(mockController, 'proj-beta');
      service.get(mockController, 'proj-gamma');

      expect(mockHttpController.get).toHaveBeenCalledTimes(3);
      expect(mockHttpController.get).toHaveBeenNthCalledWith(1, mockController, '/projects/proj-alpha');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(2, mockController, '/projects/proj-beta');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(3, mockController, '/projects/proj-gamma');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty project name in add', () => {
      mockHttpController.post.mockReturnValue(of(mockProject));

      service.add(mockController, '', 'project-123');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects',
        { name: '', project_id: 'project-123' }
      );
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

    it('should handle empty nodes list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.nodes(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty links list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.links(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty drawings list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.drawings(mockController, 'project-123');

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
