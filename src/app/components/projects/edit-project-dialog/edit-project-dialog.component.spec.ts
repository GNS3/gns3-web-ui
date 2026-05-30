import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Observable } from 'rxjs';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EditProjectDialogComponent } from './edit-project-dialog.component';
import { ReadmeEditorComponent } from './readme-editor/readme-editor.component';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { Project, ProjectVariable } from '@models/project';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EditProjectDialogComponent', () => {
  let component: EditProjectDialogComponent;
  let fixture: ComponentFixture<EditProjectDialogComponent>;

  let mockProjectService: Record<string, ReturnType<typeof vi.fn>>;
  let mockToastService: Record<string, ReturnType<typeof vi.fn>>;
  let mockDialogRef: Record<string, ReturnType<typeof vi.fn>>;
  let dialogOpenMock: ReturnType<typeof vi.fn>;
  let mockDialogInstance: { open: ReturnType<typeof vi.fn> };

  const mockController: Controller = {
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
  };

  const createMockProject = (): Project => ({
    name: 'Test Project',
    project_id: 'project-123',
    scene_width: 1000,
    scene_height: 800,
    grid_size: 25,
    drawing_grid_size: 25,
    auto_close: false,
    auto_open: true,
    auto_start: false,
    show_interface_labels: false,
    variables: [
      { name: 'VAR1', value: 'value1' },
      { name: 'VAR2', value: 'value2' },
    ],
    filename: '',
    path: '',
    status: '',
    created_by: '',
    readonly: false,
    show_layers: false,
    show_grid: false,
    snap_to_grid: false,
  });

  class MockMatDialog {
    open = vi.fn().mockImplementation((config: any) => ({
      afterClosed: vi.fn().mockReturnValue(of(true)),
      componentInstance: null,
      config: config,
    }));
  }

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    mockDialogInstance = new MockMatDialog();
    dialogOpenMock = mockDialogInstance.open;

    mockToastService = { success: vi.fn(), error: vi.fn() };

    mockProjectService = {
      getReadmeFile: vi.fn().mockReturnValue(of('')),
      update: vi.fn().mockReturnValue(of(createMockProject())),
      postReadmeFile: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        EditProjectDialogComponent,
        ReadmeEditorComponent,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialogInstance },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ToasterService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditProjectDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  const initializeComponent = () => {
    component.controller = mockController;
    component.project = createMockProject();
    fixture.detectChanges();
  };

  describe('Component Creation', () => {
    it('should create the component', () => {
      initializeComponent();
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should populate signals from project data', () => {
      initializeComponent();

      expect(component.projectName()).toBe(component.project.name);
      expect(component.width()).toBe(component.project.scene_width);
      expect(component.height()).toBe(component.project.scene_height);
      expect(component.nodeGridSize()).toBe(component.project.grid_size);
      expect(component.drawingGridSize()).toBe(component.project.drawing_grid_size);
    });

    it('should load project variables into variables signal', () => {
      initializeComponent();

      expect(component.variables()).toEqual(component.project.variables);
    });

    it('should store original variables for comparison', () => {
      initializeComponent();

      expect(component['originalVariables']).toEqual(component.project.variables);
    });

    it('should set auto_close as negated project.auto_close', () => {
      initializeComponent();

      expect(component.auto_close()).toBe(!component.project.auto_close);
    });
  });

  describe('addVariable', () => {
    it('should add variable to variables array when form is valid', () => {
      initializeComponent();
      const initialLength = component.variables().length;
      component.variableName.set('NEW_VAR');
      component.variableValue.set('new_value');

      component.addVariable();

      expect(component.variables().length).toBe(initialLength + 1);
      expect(component.variables()).toContainEqual({ name: 'NEW_VAR', value: 'new_value' });
    });

    it('should show error toast when name is empty', () => {
      initializeComponent();
      component.variableName.set('');
      component.variableValue.set('some_value');

      component.addVariable();

      expect(mockToastService.error).toHaveBeenCalledWith('Fill all required fields with correct values.');
    });

    it('should show error toast when value is empty', () => {
      initializeComponent();
      component.variableName.set('SOME_NAME');
      component.variableValue.set('');

      component.addVariable();

      expect(mockToastService.error).toHaveBeenCalledWith('Fill all required fields with correct values.');
    });

    it('should not add variable when both fields are empty', () => {
      initializeComponent();
      const initialLength = component.variables().length;
      component.variableName.set('');
      component.variableValue.set('');

      component.addVariable();

      expect(component.variables().length).toBe(initialLength);
    });
  });

  describe('deleteVariable', () => {
    it('should be a function on the component', () => {
      initializeComponent();
      expect(typeof component.deleteVariable).toBe('function');
    });
  });

  describe('hasVariablesChanged', () => {
    it('should be a function on the component', () => {
      initializeComponent();
      expect(typeof component.hasVariablesChanged).toBe('function');
    });

    it('should return false when variables have not changed', () => {
      initializeComponent();

      expect(component.hasVariablesChanged()).toBe(false);
    });

    it('should return true when a variable is added', () => {
      initializeComponent();
      component['variables'].update((vars) => [
        ...vars,
        { name: 'NEW_VAR', value: 'new_value' },
      ]);

      expect(component.hasVariablesChanged()).toBe(true);
    });

    it('should return true when a variable is removed', () => {
      initializeComponent();
      component['variables'].set([{ name: 'VAR1', value: 'value1' }]);

      expect(component.hasVariablesChanged()).toBe(true);
    });

    it('should return true when a variable value is changed', () => {
      initializeComponent();
      component['variables'].set([
        { name: 'VAR1', value: 'changed_value' },
        { name: 'VAR2', value: 'value2' },
      ]);

      expect(component.hasVariablesChanged()).toBe(true);
    });

    it('should return true when a variable name is changed', () => {
      initializeComponent();
      component['variables'].set([
        { name: 'CHANGED_VAR', value: 'value1' },
        { name: 'VAR2', value: 'value2' },
      ]);

      expect(component.hasVariablesChanged()).toBe(true);
    });

    it('should return false when variables are the same but in different order', () => {
      initializeComponent();
      component['variables'].set([
        { name: 'VAR2', value: 'value2' },
        { name: 'VAR1', value: 'value1' },
      ]);

      expect(component.hasVariablesChanged()).toBe(false);
    });

    it('should return true when project has no variables initially', () => {
      component.project = createMockProject();
      component.project.variables = [];
      initializeComponent();

      component['variables'].set([{ name: 'NEW_VAR', value: 'new_value' }]);

      expect(component.hasVariablesChanged()).toBe(true);
    });
  });

  describe('onNoClick', () => {
    it('should close the dialog', () => {
      initializeComponent();
      component.onNoClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onYesClick', () => {
    it('should update project with form values when variables unchanged', () => {
      initializeComponent();

      component.projectName.set('Updated Project');
      component.width.set(2000);
      component.onYesClick();

      expect(component.project.name).toBe('Updated Project');
      expect(component.project.scene_width).toBe(2000);
    });

    it('should set isApplying and apply changes when variables unchanged', () => {
      initializeComponent();

      component.onYesClick();

      // Should call the update service
      expect(mockProjectService.update).toHaveBeenCalledWith(mockController, component.project);
    });

    it('should call projectService.update when variables unchanged', () => {
      initializeComponent();

      component.onYesClick();

      expect(mockProjectService.update).toHaveBeenCalledWith(mockController, component.project);
    });

    it('should post readme file after update', () => {
      initializeComponent();

      component.onYesClick();

      expect(mockProjectService.postReadmeFile).toHaveBeenCalled();
    });

    it('should show success toast on update success', () => {
      initializeComponent();

      component.onYesClick();

      expect(mockToastService.success).toHaveBeenCalledWith('Project Test Project updated.');
    });

    it('should set isApplying to false on successful update', () => {
      initializeComponent();

      component.onYesClick();

      expect(component.isApplying()).toBe(false);
    });

    it('should close dialog on successful update', () => {
      initializeComponent();

      component.onYesClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error toast when form is invalid (empty name)', () => {
      initializeComponent();
      component.projectName.set('');

      component.onYesClick();

      expect(mockToastService.error).toHaveBeenCalledWith('Fill all required fields with correct values.');
    });

    it('should not call update when projectName is empty', () => {
      initializeComponent();
      component.projectName.set('');

      component.onYesClick();

      expect(mockProjectService.update).not.toHaveBeenCalled();
    });

    it('should set auto_close as negated value', () => {
      initializeComponent();

      const initialAutoClose = component.project.auto_close;
      component.auto_close.set(!initialAutoClose);

      component.onYesClick();

      expect(component.project.auto_close).toBe(initialAutoClose);
    });
  });

  describe('Template Bindings', () => {
    it('should expose displayedColumns for variable table', () => {
      initializeComponent();
      expect(component.displayedColumns).toEqual(['name', 'value', 'actions']);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show error toaster and reset isApplying when update fails with error.message', async () => {
      mockProjectService.update.mockReturnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );
      initializeComponent();

      component.onYesClick();

      expect(mockToastService.error).toHaveBeenCalledWith('Update failed');
      expect(component.isApplying()).toBe(false);
    });

    it('should use fallback message when update error has no message', async () => {
      mockProjectService.update.mockReturnValue(throwError(() => ({})));
      initializeComponent();

      component.onYesClick();

      expect(mockToastService.error).toHaveBeenCalledWith('Failed to update project');
      expect(component.isApplying()).toBe(false);
    });

    it('should show error toaster and reset isApplying when postReadmeFile fails', async () => {
      mockProjectService.update.mockReturnValue(of(createMockProject()));
      mockProjectService.postReadmeFile.mockReturnValue(
        throwError(() => ({ error: { message: 'Readme failed' } }))
      );
      initializeComponent();

      component.onYesClick();

      expect(mockToastService.error).toHaveBeenCalledWith('Readme failed');
      expect(component.isApplying()).toBe(false);
    });
  });
});
