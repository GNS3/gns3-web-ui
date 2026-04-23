import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { SaveProjectDialogComponent } from './save-project-dialog.component';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectNameValidator } from '../models/projectNameValidator';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('SaveProjectDialogComponent', () => {
  let component: SaveProjectDialogComponent;
  let fixture: ComponentFixture<SaveProjectDialogComponent>;
  let mockDialogRef: any;
  let mockProjectService: any;
  let mockNodesDataSource: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockProject: Project;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockProjectService = {
      list: vi.fn().mockReturnValue(of([])),
      duplicate: vi.fn().mockReturnValue(of({})),
    };

    mockNodesDataSource = {
      getItems: vi.fn().mockReturnValue([]),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

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
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        ProjectNameValidator,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveProjectDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.project = mockProject;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have projectNameForm with projectName control', () => {
      expect(component.projectNameForm).toBeTruthy();
      expect(component.projectNameForm.controls['projectName']).toBeTruthy();
    });

    it('should have controller set', () => {
      expect(component.controller).toEqual(mockController);
    });

    it('should have project set', () => {
      expect(component.project).toEqual(mockProject);
    });
  });

  describe('form getter', () => {
    it('should return form controls', () => {
      const controls = component.form;
      expect(controls['projectName']).toBeTruthy();
    });
  });

  describe('onNoClick', () => {
    it('should close the dialog', () => {
      component.onNoClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onKeyDown', () => {
    it('should call onAddClick when Enter key is pressed', () => {
      const event = { key: 'Enter' };
      const onAddClickSpy = vi.spyOn(component, 'onAddClick');

      component.onKeyDown(event);

      expect(onAddClickSpy).toHaveBeenCalled();
    });

    it('should not call onAddClick when other key is pressed', () => {
      const event = { key: 'Escape' };
      const onAddClickSpy = vi.spyOn(component, 'onAddClick');

      component.onKeyDown(event);

      expect(onAddClickSpy).not.toHaveBeenCalled();
    });
  });

  describe('onAddClick', () => {
    it('should return early when form is invalid', () => {
      component.projectNameForm.controls['projectName'].setValue('');
      component.projectNameForm.controls['projectName'].markAsTouched();

      component.onAddClick();

      expect(mockProjectService.list).not.toHaveBeenCalled();
    });

    it('should call projectService.list with controller', () => {
      component.projectNameForm.controls['projectName'].setValue('New Project');

      component.onAddClick();

      expect(mockProjectService.list).toHaveBeenCalledWith(mockController);
    });
  });

  describe('addProject', () => {
    it('should call projectService.duplicate with correct parameters', () => {
      component.projectNameForm.controls['projectName'].setValue('New Project');
      const duplicatedProject = { ...mockProject, name: 'New Project', project_id: 'proj2' };
      mockProjectService.duplicate.mockReturnValue(of(duplicatedProject));

      component.addProject();

      expect(mockProjectService.duplicate).toHaveBeenCalledWith(mockController, mockProject.project_id, 'New Project');
    });

    it('should close dialog on successful duplicate', () => {
      component.projectNameForm.controls['projectName'].setValue('New Project');
      const duplicatedProject = { ...mockProject, name: 'New Project', project_id: 'proj2' };
      mockProjectService.duplicate.mockReturnValue(of(duplicatedProject));

      component.addProject();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show success toaster on successful duplicate', () => {
      component.projectNameForm.controls['projectName'].setValue('New Project');
      const duplicatedProject = { ...mockProject, name: 'New Project', project_id: 'proj2' };
      mockProjectService.duplicate.mockReturnValue(of(duplicatedProject));

      component.addProject();

      expect(mockToasterService.success).toHaveBeenCalledWith('Project New Project added');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show error toaster when list fails with error.message', async () => {
      mockProjectService.list.mockReturnValue(
        throwError(() => ({ error: { message: 'List failed' } }))
      );
      component.projectNameForm.controls['projectName'].setValue('New Project');

      component.onAddClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('List failed');
    });

    it('should use fallback message when list error has no message', async () => {
      mockProjectService.list.mockReturnValue(throwError(() => ({})));
      component.projectNameForm.controls['projectName'].setValue('New Project');

      component.onAddClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to list projects');
    });

    it('should show error toaster when duplicate fails with error.message', async () => {
      mockProjectService.duplicate.mockReturnValue(
        throwError(() => ({ error: { message: 'Duplicate failed' } }))
      );
      component.projectNameForm.controls['projectName'].setValue('New Project');

      component.addProject();

      expect(mockToasterService.error).toHaveBeenCalledWith('Duplicate failed');
    });

    it('should use fallback message when duplicate error has no message', async () => {
      mockProjectService.duplicate.mockReturnValue(throwError(() => ({})));
      component.projectNameForm.controls['projectName'].setValue('New Project');

      component.addProject();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to save project');
    });

    it('should call markForCheck when duplicate fails', async () => {
      mockProjectService.duplicate.mockReturnValue(
        throwError(() => ({ error: { message: 'Duplicate failed' } }))
      );
      component.projectNameForm.controls['projectName'].setValue('New Project');

      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.addProject();

      expect(cdrSpy).toHaveBeenCalled();
    });
  });
});
