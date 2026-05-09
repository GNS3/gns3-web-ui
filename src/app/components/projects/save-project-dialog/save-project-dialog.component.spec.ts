import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { SaveProjectDialogComponent } from './save-project-dialog.component';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectNameValidator } from '../models/projectNameValidator';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

describe('SaveProjectDialogComponent', () => {
  let fixture: ComponentFixture<SaveProjectDialogComponent>;
  let component: SaveProjectDialogComponent;
  let mockDialogRef: any;
  let mockProjectService: any;
  let mockNodesDataSource: any;
  let mockToasterService: any;
  let mockController: Controller;
  let mockProject: Project;
  let mockValidator: any;

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const createMockProject = (name: string, projectId: string = 'proj-123'): Project =>
    ({
      project_id: projectId,
      name,
      filename: `${name}.gns3`,
      status: 'opened',
      auto_close: true,
      auto_open: false,
      auto_start: false,
      scene_width: 2000,
      scene_height: 1000,
      zoom: 100,
      show_layers: false,
      snap_to_grid: false,
      show_grid: false,
      grid_size: 75,
      drawing_grid_size: 25,
      show_interface_labels: false,
      variables: [],
      path: `/path/to/${name}`,
      readonly: false,
    } as Project);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = { close: vi.fn() };
    mockProjectService = {
      list: vi.fn().mockReturnValue(of([])),
      duplicate: vi.fn().mockReturnValue(of(createMockProject('New Project', 'proj2'))),
    };
    mockNodesDataSource = { getItems: vi.fn().mockReturnValue([]) };
    mockToasterService = { success: vi.fn(), error: vi.fn() };
    mockValidator = { get: vi.fn().mockReturnValue(null) };

    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: '192.168.1.100',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    mockProject = {
      project_id: 'proj1',
      name: 'Test Project',
      filename: 'test.gns3',
      status: 'opened',
      auto_close: true,
      auto_open: false,
      auto_start: false,
      scene_width: 2000,
      scene_height: 1000,
      zoom: 100,
      show_layers: false,
      snap_to_grid: false,
      show_grid: false,
      grid_size: 75,
      drawing_grid_size: 25,
      show_interface_labels: false,
      variables: [],
      path: '/path/to/project',
      readonly: false,
    } as Project;

    await TestBed.configureTestingModule({
      imports: [SaveProjectDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ProjectNameValidator, useValue: mockValidator },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveProjectDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.project = mockProject;
  });

  afterEach(() => {
    vi.clearAllTimers();
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Basic functionality', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have controller and project set', () => {
      expect(component.controller).toEqual(mockController);
      expect(component.project).toEqual(mockProject);
    });

    it('should close dialog when cancel is clicked', () => {
      component.onNoClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should trigger save project when Enter key is pressed', () => {
      component.projectName.set('ValidProject');
      mockProjectService.list.mockReturnValue(of([]));

      component.onKeyDown({ key: 'Enter' } as KeyboardEvent);

      expect(mockProjectService.list).toHaveBeenCalled();
    });

    it('should not trigger save project for non-Enter keys', () => {
      component.projectName.set('ValidProject');
      component.onKeyDown({ key: 'Escape' } as KeyboardEvent);

      expect(mockProjectService.list).not.toHaveBeenCalled();
    });
  });

  describe('Project creation', () => {
    it('should duplicate project successfully and emit event', async () => {
      const duplicatedProject = createMockProject('NewProject', 'proj2');
      mockProjectService.list.mockReturnValue(of([]));
      mockProjectService.duplicate.mockReturnValue(of(duplicatedProject));

      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockProjectService.duplicate).toHaveBeenCalledWith(mockController, 'proj1', 'NewProject');
      expect(mockToasterService.success).toHaveBeenCalledWith('Project NewProject added');
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should emit onAddProject event after successful creation', async () => {
      const duplicatedProject = createMockProject('NewProject', 'proj2');
      mockProjectService.list.mockReturnValue(of([]));
      mockProjectService.duplicate.mockReturnValue(of(duplicatedProject));

      const emitSpy = vi.spyOn(component.onAddProject, 'emit');
      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(emitSpy).toHaveBeenCalledWith('proj2');
    });

    it('should show error when project name already exists', async () => {
      const existingProject = createMockProject('ExistingProject');
      mockProjectService.list.mockReturnValue(of([existingProject]));

      component.projectName.set('ExistingProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Project with this name already exists.');
      expect(mockProjectService.duplicate).not.toHaveBeenCalled();
    });

    it('should show error when running nodes exist', async () => {
      mockProjectService.list.mockReturnValue(of([]));
      mockNodesDataSource.getItems.mockReturnValue([
        { status: 'started', node_type: 'vpcs' },
      ]);

      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Please stop all nodes in order to save project.');
      expect(mockProjectService.duplicate).not.toHaveBeenCalled();
    });

    it('should not create project when name is empty', () => {
      component.projectName.set('');
      component.onAddClick();

      expect(mockProjectService.list).not.toHaveBeenCalled();
      expect(mockProjectService.duplicate).not.toHaveBeenCalled();
    });

    it('should not create project when name has invalid characters', () => {
      mockValidator.get.mockReturnValue({ invalidName: true });
      component.projectName.set('Invalid@Project#');
      component.onAddClick();

      expect(mockProjectService.list).not.toHaveBeenCalled();
      expect(mockProjectService.duplicate).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should show error when duplicate fails', async () => {
      mockProjectService.list.mockReturnValue(of([]));
      mockProjectService.duplicate.mockReturnValue(throwError(() => ({ error: { message: 'Duplicate failed' } })));

      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Duplicate failed');
    });

    it('should show fallback error when duplicate has no error message', async () => {
      mockProjectService.list.mockReturnValue(of([]));
      mockProjectService.duplicate.mockReturnValue(throwError(() => ({})));

      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to save project');
    });

    it('should show error when checking project list fails', async () => {
      mockProjectService.list.mockReturnValue(throwError(() => ({ error: { message: 'List failed' } })));

      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('List failed');
    });

    it('should show fallback error when list fails with no message', async () => {
      mockProjectService.list.mockReturnValue(throwError(() => ({})));

      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to check project name');
    });
  });
});
