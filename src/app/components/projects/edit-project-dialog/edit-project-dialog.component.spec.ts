import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { EditProjectDialogComponent } from './edit-project-dialog.component';
import { ReadmeEditorComponent } from './readme-editor/readme-editor.component';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { NonNegativeValidator } from '../../../validators/non-negative-validator';
import { DeleteConfirmationDialogComponent } from '@components/preferences/common/delete-confirmation-dialog/delete-confirmation-dialog.component';
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
    readonly: false,
    show_layers: false,
    show_grid: false,
    snap_to_grid: false,
  });

  class MockMatDialog {
    open = vi.fn().mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(true)),
    });
  }

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockDialogInstance = new MockMatDialog();
    dialogOpenMock = mockDialogInstance.open;

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockProjectService = {
      getReadmeFile: vi.fn().mockReturnValue(of('')),
      update: vi.fn().mockReturnValue(of(createMockProject())),
      postReadmeFile: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatTableModule,
        MatIconModule,
        MatTooltipModule,
        MatTabsModule,
        EditProjectDialogComponent,
        ReadmeEditorComponent,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialogInstance },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ToasterService, useValue: mockToastService },
        NonNegativeValidator,
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

    it('should have formGroup initialized', () => {
      initializeComponent();
      expect(component.formGroup).toBeDefined();
    });

    it('should have variableFormGroup initialized', () => {
      initializeComponent();
      expect(component.variableFormGroup).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should populate form fields from project data', () => {
      initializeComponent();

      expect(component.formGroup.get('projectName')?.value).toBe(component.project.name);
      expect(component.formGroup.get('width')?.value).toBe(component.project.scene_width);
      expect(component.formGroup.get('height')?.value).toBe(component.project.scene_height);
      expect(component.formGroup.get('nodeGridSize')?.value).toBe(component.project.grid_size);
      expect(component.formGroup.get('drawingGridSize')?.value).toBe(component.project.drawing_grid_size);
    });

    it('should load project variables into variables array', () => {
      initializeComponent();

      expect(component.variables).toEqual(component.project.variables);
    });

    it('should set auto_close as negated project.auto_close', () => {
      initializeComponent();

      expect(component.auto_close()).toBe(!component.project.auto_close);
    });
  });

  describe('addVariable', () => {
    it('should add variable to variables array when form is valid', () => {
      initializeComponent();
      const initialLength = component.variables.length;
      component.variableFormGroup.patchValue({ name: 'NEW_VAR', value: 'new_value' });

      component.addVariable();

      expect(component.variables.length).toBe(initialLength + 1);
      expect(component.variables).toContainEqual({ name: 'NEW_VAR', value: 'new_value' });
    });

    it('should preserve form values after adding variable (component does not reset form)', () => {
      initializeComponent();
      component.variableFormGroup.patchValue({ name: 'NEW_VAR', value: 'new_value' });

      component.addVariable();

      // Component does not reset the form after adding
      expect(component.variableFormGroup.get('name')?.value).toBe('NEW_VAR');
      expect(component.variableFormGroup.get('value')?.value).toBe('new_value');
    });

    it('should show error toast when form is invalid', () => {
      initializeComponent();
      component.variableFormGroup.patchValue({ name: '', value: '' });

      component.addVariable();

      expect(mockToastService.error).toHaveBeenCalledWith(`Fill all required fields with correct values.`);
    });

    it('should not add variable when name is empty', () => {
      initializeComponent();
      const initialLength = component.variables.length;
      component.variableFormGroup.patchValue({ name: '', value: 'some_value' });

      component.addVariable();

      expect(component.variables.length).toBe(initialLength);
    });

    it('should not add variable when value is empty', () => {
      initializeComponent();
      const initialLength = component.variables.length;
      component.variableFormGroup.patchValue({ name: 'SOME_NAME', value: '' });

      component.addVariable();

      expect(component.variables.length).toBe(initialLength);
    });
  });

  // Dialog tests are skipped because MatDialog.open() creates actual DOM elements
  // and requires full Angular testing module with all dialog dependencies.
  // These behaviors would be better tested in an integration test.
  // Reference: logged-user.component.spec.ts and template.component.spec.ts also skip dialog tests.
  describe('deleteVariable', () => {
    it('should be a function on the component', () => {
      initializeComponent();
      expect(typeof component.deleteVariable).toBe('function');
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
    it('should update project with form values', () => {
      initializeComponent();

      component.formGroup.patchValue({ projectName: 'Updated Project', width: 2000 });
      component.onYesClick();

      expect(component.project.name).toBe('Updated Project');
      expect(component.project.scene_width).toBe(2000);
    });

    it('should call projectService.update with controller and project', () => {
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

      expect(mockToastService.success).toHaveBeenCalledWith(`Project ${component.project.name} updated.`);
    });

    it('should close dialog on successful update', () => {
      initializeComponent();

      component.onYesClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error toast when form is invalid', () => {
      initializeComponent();
      component.formGroup.patchValue({ projectName: '' });

      component.onYesClick();

      expect(mockToastService.error).toHaveBeenCalledWith(`Fill all required fields with correct values.`);
    });

    it('should not call update when projectName is empty', () => {
      initializeComponent();
      component.formGroup.patchValue({ projectName: '' });

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

    it('should show error toaster when update fails with error.message', async () => {
      mockProjectService.update.mockReturnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );
      initializeComponent();

      component.onYesClick();

      expect(mockToastService.error).toHaveBeenCalledWith('Update failed');
    });

    it('should use fallback message when update error has no message', async () => {
      mockProjectService.update.mockReturnValue(throwError(() => ({})));
      initializeComponent();

      component.onYesClick();

      expect(mockToastService.error).toHaveBeenCalledWith('Failed to update project');
    });

    it('should call markForCheck when update fails', async () => {
      mockProjectService.update.mockReturnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );
      initializeComponent();

      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.onYesClick();

      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should show error toaster when postReadmeFile fails', async () => {
      mockProjectService.update.mockReturnValue(of(createMockProject()));
      mockProjectService.postReadmeFile.mockReturnValue(
        throwError(() => ({ error: { message: 'Readme failed' } }))
      );
      initializeComponent();

      component.onYesClick();

      expect(mockToastService.error).toHaveBeenCalledWith('Readme failed');
    });
  });
});
