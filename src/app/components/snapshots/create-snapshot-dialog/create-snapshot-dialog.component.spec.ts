import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CreateSnapshotDialogComponent } from './create-snapshot-dialog.component';
import { SnapshotService } from '@services/snapshot.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Snapshot } from '@models/snapshot';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CreateSnapshotDialogComponent', () => {
  let fixture: ComponentFixture<CreateSnapshotDialogComponent>;
  let mockSnapshotService: any;
  let mockToasterService: any;
  let mockDialogRef: any;
  let mockController: Controller;
  let mockProject: Project;

  const createMockController = (): Controller =>
    ({
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
    } as Controller);

  const createMockProject = (): Project =>
    ({
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
    } as Project);

  const createComponent = () => {
    fixture = TestBed.createComponent(CreateSnapshotDialogComponent);
    return fixture.componentInstance;
  };

  beforeEach(async () => {
    mockController = createMockController();
    mockProject = createMockProject();

    mockSnapshotService = {
      list: vi.fn().mockReturnValue(of([])),
    };

    mockToasterService = {
      error: vi.fn(),
      warning: vi.fn(),
      success: vi.fn(),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CreateSnapshotDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { controller: mockController, project: mockProject } },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: SnapshotService, useValue: mockSnapshotService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      const component = createComponent();
      expect(component).toBeTruthy();
    });

    it('should receive controller from dialog data', () => {
      const component = createComponent();
      expect(component.controller).toEqual(mockController);
    });

    it('should receive project from dialog data', () => {
      const component = createComponent();
      expect(component.project).toEqual(mockProject);
    });

    it('should initialize with empty existingSnapshotNames', () => {
      const component = createComponent();
      expect(component.existingSnapshotNames).toEqual([]);
    });

    it('should initialize with a new Snapshot instance', () => {
      const component = createComponent();
      expect(component.snapshot).toBeInstanceOf(Snapshot);
    });
  });

  describe('Form Initialization', () => {
    it('should create inputForm with snapshotName control', () => {
      const component = createComponent();
      expect(component.inputForm).toBeInstanceOf(UntypedFormGroup);
      expect(component.inputForm.get('snapshotName')).toBeInstanceOf(UntypedFormControl);
    });

    it('should have snapshotName control with required validator', () => {
      const component = createComponent();
      const snapshotNameControl = component.inputForm.get('snapshotName');
      expect(snapshotNameControl.hasError('required')).toBe(true);
      snapshotNameControl.setValue('some-value');
      expect(snapshotNameControl.hasError('required')).toBe(false);
    });

    it('should be invalid when form is initially empty due to required validator', () => {
      const component = createComponent();
      expect(component.inputForm.invalid).toBe(true);
    });
  });

  describe('ngOnInit - existing snapshots loading', () => {
    it('should load existing snapshot names from the project', async () => {
      const mockSnapshots = [
        { name: 'snapshot1', snapshot_id: 's1' } as Snapshot,
        { name: 'snapshot2', snapshot_id: 's2' } as Snapshot,
      ];
      mockSnapshotService.list.mockReturnValue(of(mockSnapshots));

      const component = createComponent();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockSnapshotService.list).toHaveBeenCalledWith(mockController, mockProject.project_id);
      expect(component.existingSnapshotNames).toEqual(['snapshot1', 'snapshot2']);
    });

    it('should not call list if project has no project_id', async () => {
      const projectWithoutId = { ...mockProject, project_id: null };
      mockSnapshotService.list.mockReturnValue(of([]));

      // Create new TestBed with different data
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CreateSnapshotDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: { controller: mockController, project: projectWithoutId } },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: SnapshotService, useValue: mockSnapshotService },
          { provide: ToasterService, useValue: mockToasterService },
        ],
      }).compileComponents();

      const component = createComponent();
      // No detectChanges needed since list is not called

      expect(mockSnapshotService.list).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show error toaster when list fails with error.message', async () => {
      mockSnapshotService.list.mockReturnValue(
        throwError(() => ({ error: { message: 'List failed' } }))
      );

      const component = createComponent();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('List failed');
    });

    it('should use fallback message when list error has no message', async () => {
      mockSnapshotService.list.mockReturnValue(throwError(() => ({})));

      const component = createComponent();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load snapshots');
    });
  });

  describe('onAddClick', () => {
    describe('when form is invalid', () => {
      it('should show error when snapshotName is empty', () => {
        const component = createComponent();
        component.inputForm.get('snapshotName').setValue('');
        component.inputForm.get('snapshotName').markAsTouched();

        component.onAddClick();

        expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });

      it('should show error when snapshotName contains only whitespace', () => {
        const component = createComponent();
        component.inputForm.get('snapshotName').setValue('   ');

        component.onAddClick();

        expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });
    });

    describe('when snapshot name already exists', () => {
      it('should show error when snapshot name is duplicate', async () => {
        const mockSnapshots = [{ name: 'existing-snapshot', snapshot_id: 's1' } as Snapshot];
        mockSnapshotService.list.mockReturnValue(of(mockSnapshots));

        const component = createComponent();
        fixture.detectChanges();
        await fixture.whenStable();

        component.inputForm.get('snapshotName').setValue('existing-snapshot');

        component.onAddClick();

        expect(mockToasterService.error).toHaveBeenCalledWith('Snapshot with this name already exists');
        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });
    });

    describe('when snapshot name is valid and unique', () => {
      it('should close dialog with the snapshot when name is valid', () => {
        const component = createComponent();
        component.inputForm.get('snapshotName').setValue('my-new-snapshot');

        component.onAddClick();

        expect(component.snapshot.name).toBe('my-new-snapshot');
        expect(mockDialogRef.close).toHaveBeenCalledWith(component.snapshot);
      });

      it('should trim the snapshot name before saving', () => {
        const component = createComponent();
        component.inputForm.get('snapshotName').setValue('  trimmed-snapshot  ');

        component.onAddClick();

        expect(component.snapshot.name).toBe('trimmed-snapshot');
        expect(mockDialogRef.close).toHaveBeenCalledWith(component.snapshot);
      });
    });

    describe('edge cases for snapshot name', () => {
      it('should accept snapshot name with special characters', () => {
        const component = createComponent();
        component.inputForm.get('snapshotName').setValue('snapshot-123_abc');

        component.onAddClick();

        expect(component.snapshot.name).toBe('snapshot-123_abc');
        expect(mockDialogRef.close).toHaveBeenCalled();
      });

      it('should accept single character snapshot name', () => {
        const component = createComponent();
        component.inputForm.get('snapshotName').setValue('a');

        component.onAddClick();

        expect(component.snapshot.name).toBe('a');
        expect(mockDialogRef.close).toHaveBeenCalled();
      });

      it('should accept snapshot name with leading/trailing spaces (trimmed)', () => {
        const component = createComponent();
        component.inputForm.get('snapshotName').setValue('  valid-snapshot  ');

        component.onAddClick();

        expect(component.snapshot.name).toBe('valid-snapshot');
        expect(mockDialogRef.close).toHaveBeenCalled();
      });

      it('should not accept empty string after trimming', () => {
        const component = createComponent();
        component.inputForm.get('snapshotName').setValue('   ');

        component.onAddClick();

        expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });
    });
  });

  describe('Template Rendering', () => {
    it('should display Cancel button that closes dialog', () => {
      const component = createComponent();
      fixture.detectChanges();

      const cancelButton = fixture.nativeElement.querySelector('button[mat-dialog-close]');
      expect(cancelButton).toBeTruthy();
    });

    it('should display Add button', () => {
      const component = createComponent();
      fixture.detectChanges();

      const addButton = fixture.nativeElement.querySelector('button[mat-raised-button]');
      expect(addButton).toBeTruthy();
      expect(addButton.textContent).toContain('Add');
    });

    it('should have snapshotName input field', () => {
      const component = createComponent();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input[formControlName="snapshotName"]');
      expect(input).toBeTruthy();
    });
  });

  describe('Zoneless Change Detection', () => {
    it('should load existing snapshots and update existingSnapshotNames via markForCheck', async () => {
      const mockSnapshots = [{ name: 'test-snapshot', snapshot_id: 's1' } as Snapshot];
      mockSnapshotService.list.mockReturnValue(of(mockSnapshots));

      const component = createComponent();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.existingSnapshotNames).toEqual(['test-snapshot']);
    });
  });
});
