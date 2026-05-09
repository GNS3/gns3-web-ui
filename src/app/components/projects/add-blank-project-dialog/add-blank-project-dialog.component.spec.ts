import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AddBlankProjectDialogComponent } from './add-blank-project-dialog.component';
import { ProjectNameValidator } from '../models/projectNameValidator';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

describe('AddBlankProjectDialogComponent', () => {
  let fixture: ComponentFixture<AddBlankProjectDialogComponent>;
  let component: AddBlankProjectDialogComponent;
  let mockDialogRef: any;
  let mockRouter: any;
  let mockProjectService: any;
  let mockToasterService: any;
  let mockController: Controller;

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
      status: 'closed',
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
    mockRouter = { navigate: vi.fn() };
    mockProjectService = {
      list: vi.fn().mockReturnValue(of([])),
      add: vi.fn().mockReturnValue(of(createMockProject('Test Project'))),
    };
    mockToasterService = { success: vi.fn(), error: vi.fn() };
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

    await TestBed.configureTestingModule({
      imports: [AddBlankProjectDialogComponent, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: Router, useValue: mockRouter },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ProjectNameValidator, useValue: { get: vi.fn().mockReturnValue(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddBlankProjectDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    fixture.detectChanges();
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

    it('should close dialog when cancel is clicked', () => {
      component.onNoClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should trigger add project when Enter key is pressed', () => {
      component.projectName.set('ValidProject');
      mockProjectService.list.mockReturnValue(of([]));

      component.onKeyDown({ key: 'Enter' } as KeyboardEvent);
      vi.runAllTimersAsync();

      expect(mockProjectService.list).toHaveBeenCalled();
    });

    it('should not trigger add project for non-Enter keys', () => {
      component.projectName.set('ValidProject');
      component.onKeyDown({ key: 'Escape' } as KeyboardEvent);

      expect(mockProjectService.list).not.toHaveBeenCalled();
    });
  });

  describe('Project creation', () => {
    it('should create project successfully and navigate', async () => {
      const testProject = createMockProject('NewProject');
      mockProjectService.list.mockReturnValue(of([]));
      mockProjectService.add.mockReturnValue(of(testProject));

      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockProjectService.add).toHaveBeenCalledWith(mockController, 'NewProject', component.uuid());
      expect(mockToasterService.success).toHaveBeenCalledWith('Project NewProject added');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 1, 'project', 'proj-123']);
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error when project name already exists', async () => {
      const existingProject = createMockProject('ExistingProject');
      mockProjectService.list.mockReturnValue(of([existingProject]));

      component.projectName.set('ExistingProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Project with this name already exists.');
      expect(mockProjectService.add).not.toHaveBeenCalled();
    });

    it('should not create project when name is empty', () => {
      component.projectName.set('');
      component.onAddClick();

      expect(mockProjectService.list).not.toHaveBeenCalled();
      expect(mockProjectService.add).not.toHaveBeenCalled();
    });

    it('should not create project when name has invalid characters', () => {
      component.projectName.set('Invalid@Project#');
      component.onAddClick();

      expect(mockProjectService.list).not.toHaveBeenCalled();
      expect(mockProjectService.add).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should show error when project creation fails', async () => {
      mockProjectService.list.mockReturnValue(of([]));
      mockProjectService.add.mockReturnValue(throwError(() => ({ error: { message: 'Creation failed' } })));

      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Creation failed');
    });

    it('should show fallback error when no error message', async () => {
      mockProjectService.list.mockReturnValue(of([]));
      mockProjectService.add.mockReturnValue(throwError(() => ({})));

      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Cannot create new project');
    });

    it('should show error when checking project list fails', async () => {
      mockProjectService.list.mockReturnValue(throwError(() => ({ error: { message: 'List failed' } })));

      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('List failed');
    });
  });

  describe('Event emission', () => {
    it('should emit onAddProject event after successful creation', async () => {
      const testProject = createMockProject('NewProject');
      mockProjectService.list.mockReturnValue(of([]));
      mockProjectService.add.mockReturnValue(of(testProject));

      const emitSpy = vi.spyOn(component.onAddProject, 'emit');
      component.projectName.set('NewProject');
      component.onAddClick();
      await vi.runAllTimersAsync();

      expect(emitSpy).toHaveBeenCalledWith('proj-123');
    });
  });
});
