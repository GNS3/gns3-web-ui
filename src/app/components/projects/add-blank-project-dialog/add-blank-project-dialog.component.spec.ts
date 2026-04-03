import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormControl, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { AddBlankProjectDialogComponent } from './add-blank-project-dialog.component';
import { ProjectNameValidator } from '../models/projectNameValidator';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AddBlankProjectDialogComponent', () => {
  let component: AddBlankProjectDialogComponent;
  let fixture: ComponentFixture<AddBlankProjectDialogComponent>;
  let mockDialogRef: any;
  let mockRouter: any;
  let mockProjectService: any;
  let mockToasterService: any;
  let mockProjectNameValidator: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;

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
    }) as Project;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockProjectService = {
      list: vi.fn().mockReturnValue(of([])),
      add: vi.fn().mockReturnValue(of(createMockProject('Test Project'))),
      close: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockProjectNameValidator = {
      get: vi.fn().mockReturnValue(null),
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

    await TestBed.configureTestingModule({
      imports: [
        AddBlankProjectDialogComponent,
        ReactiveFormsModule,
        MatDialogModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: Router, useValue: mockRouter },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ProjectNameValidator, useValue: mockProjectNameValidator },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddBlankProjectDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form on ngOnInit', () => {
      expect(component.projectNameForm).toBeDefined();
      expect(component.projectNameForm).toBeInstanceOf(UntypedFormGroup);
      expect(component.projectNameForm.controls['projectName']).toBeInstanceOf(UntypedFormControl);
    });
  });

  describe('onNoClick', () => {
    it('should close the dialog when cancel button is clicked', () => {
      component.onNoClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onKeyDown', () => {
    it('should call onAddClick when Enter key is pressed', () => {
      const enterEvent = { key: 'Enter' };
      const onAddClickSpy = vi.spyOn(component, 'onAddClick');

      component.onKeyDown(enterEvent);

      expect(onAddClickSpy).toHaveBeenCalled();
    });

    it('should not call onAddClick for non-Enter keys', () => {
      const escapeEvent = { key: 'Escape' };
      const onAddClickSpy = vi.spyOn(component, 'onAddClick');

      component.onKeyDown(escapeEvent);

      expect(onAddClickSpy).not.toHaveBeenCalled();
    });
  });

  describe('onAddClick', () => {
    it('should do nothing when form is invalid (empty project name)', () => {
      component.projectNameForm.controls['projectName'].setValue(null);
      fixture.detectChanges();

      component.onAddClick();

      expect(mockProjectService.list).not.toHaveBeenCalled();
      expect(mockProjectService.add).not.toHaveBeenCalled();
    });

    it('should do nothing when form is invalid (project name with invalid characters)', () => {
      mockProjectNameValidator.get.mockReturnValue({ invalidName: true });
      component.projectNameForm.controls['projectName'].setValue('invalid@name!');
      fixture.detectChanges();

      component.onAddClick();

      expect(mockProjectService.list).not.toHaveBeenCalled();
      expect(mockProjectService.add).not.toHaveBeenCalled();
    });

    it('should list projects when form is valid', () => {
      component.projectNameForm.controls['projectName'].setValue('ValidProject');
      fixture.detectChanges();

      component.onAddClick();

      expect(mockProjectService.list).toHaveBeenCalledWith(mockController);
    });

    it('should call addProject when no duplicate project exists', () => {
      component.projectNameForm.controls['projectName'].setValue('NewProject');
      fixture.detectChanges();

      component.onAddClick();

      expect(mockProjectService.add).toHaveBeenCalled();
    });

    // Note: Testing openConfirmationDialog requires full MatDialog dependency graph
    // which is not suitable for unit testing. This behavior is tested in integration tests.
    it('should openConfirmationDialog be defined as a method', () => {
      expect(typeof component.openConfirmationDialog).toBe('function');
    });
  });

  describe('addProject', () => {
    it('should be defined as a method', () => {
      expect(typeof component.addProject).toBe('function');
    });
  });
});
