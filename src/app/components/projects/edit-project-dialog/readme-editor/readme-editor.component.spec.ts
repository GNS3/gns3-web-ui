import { ChangeDetectorRef, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ReadmeEditorComponent } from './readme-editor.component';
import { ProjectService } from '@services/project.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ReadmeEditorComponent', () => {
  let component: ReadmeEditorComponent;
  let mockProjectService: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockProject: Project;

  const createMockProject = (): Project =>
    ({
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
      variables: [],
      path: '/path/to/project',
      status: 'opened',
      readonly: false,
      drawing_grid_size: 25,
    } as Project);

  const createMockController = (): Controller =>
    ({
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
    } as Controller);

  beforeEach(() => {
    mockController = createMockController();
    mockProject = createMockProject();

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    mockProjectService = {
      getReadmeFile: vi.fn(),
    };

    // Create component using Object.create to bypass constructor
    component = Object.create(ReadmeEditorComponent.prototype);

    // Set up the signal inputs as signal functions
    const controllerSignal = signal<Controller | undefined>(mockController);
    const projectSignal = signal<Project | undefined>(mockProject);

    // Use Object.defineProperty to set up the signal inputs
    // The getter returns the signal function (which is called with () to get value)
    Object.defineProperty(component, 'controller', {
      get: () => controllerSignal,
      configurable: true,
    });
    Object.defineProperty(component, 'project', {
      get: () => projectSignal,
      configurable: true,
    });

    // Set up private services
    (component as any).projectService = mockProjectService;
    (component as any).cd = mockChangeDetectorRef;

    // Initialize markdown signal
    (component as any).markdown = signal('');
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should call projectService.getReadmeFile with controller and project_id', () => {
      const readmeContent = '# Test Project\n\nThis is a test.';
      mockProjectService.getReadmeFile.mockReturnValue(of(readmeContent));

      component.ngOnInit();

      expect(mockProjectService.getReadmeFile).toHaveBeenCalledWith(mockController, mockProject.project_id);
    });

    it('should set markdown signal with file content on success', () => {
      const readmeContent = '# Test Project\n\nThis is a test.';
      mockProjectService.getReadmeFile.mockReturnValue(of(readmeContent));

      component.ngOnInit();

      expect(component.markdown()).toBe(readmeContent);
    });

    it('should set markdown to empty string on 404 error', () => {
      mockProjectService.getReadmeFile.mockReturnValue(throwError(() => ({ status: 404 })));

      component.ngOnInit();

      expect(component.markdown()).toBe('');
    });

    it('should call markForCheck on successful load', () => {
      mockProjectService.getReadmeFile.mockReturnValue(of('# Readme'));

      component.ngOnInit();

      expect(mockChangeDetectorRef.markForCheck).toHaveBeenCalled();
    });

    it('should call markForCheck on 404 error', () => {
      mockProjectService.getReadmeFile.mockReturnValue(throwError(() => ({ status: 404 })));

      component.ngOnInit();

      expect(mockChangeDetectorRef.markForCheck).toHaveBeenCalled();
    });
  });

  describe('markdown signal', () => {
    it('should allow setting markdown value', () => {
      component.markdown.set('# New Content');
      expect(component.markdown()).toBe('# New Content');
    });

    it('should allow clearing markdown value', () => {
      component.markdown.set('# Content');
      component.markdown.set('');
      expect(component.markdown()).toBe('');
    });
  });
});
