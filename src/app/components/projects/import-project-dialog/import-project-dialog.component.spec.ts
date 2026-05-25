import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImportProjectDialogComponent } from './import-project-dialog.component';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ProjectNameValidator } from '../models/projectNameValidator';
import { UploadServiceService } from '../../../common/uploading-processbar/upload-service.service';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { MatDialogModule } from '@angular/material/dialog';
import { FileUploader } from 'ng2-file-upload';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ImportProjectDialogComponent', () => {
  let fixture: ComponentFixture<ImportProjectDialogComponent>;
  let component: ImportProjectDialogComponent;
  let mockDialogRef: any;
  let mockMatSnackBar: any;
  let mockProjectService: any;
  let mockToasterService: any;
  let mockUploadServiceService: any;
  let mockController: Controller;
  let mockProject: Project;
  let mockValidator: any;

  const createMockController = (): Controller =>
    ({
      id: 1,
      authToken: 'test-auth-token',
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
      created_by: '',
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

  const createMockUploader = (): FileUploader => {
    const uploader = new FileUploader({ url: '' });
    uploader.queue = [];
    uploader.clearQueue = vi.fn();
    uploader.cancelAll = vi.fn();
    uploader.uploadItem = vi.fn();
    return uploader;
  };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    mockMatSnackBar = {
      openFromComponent: vi.fn().mockReturnValue({ dismiss: vi.fn() }),
      open: vi.fn().mockReturnValue({ dismiss: vi.fn() }),
    };

    mockProjectService = {
      list: vi.fn().mockReturnValue(of([])),
      delete: vi.fn().mockReturnValue(of({})),
      close: vi.fn().mockReturnValue(of({})),
      getUploadPath: vi.fn().mockReturnValue('http://localhost:3080/v4/upload/project/uuid/name'),
    };

    mockToasterService = { warning: vi.fn(), error: vi.fn(), success: vi.fn() };

    mockUploadServiceService = {
      processBarCount: vi.fn(),
      currentCancelItemDetails: of(false),
      cancelFileUploading: vi.fn(),
    };

    mockValidator = { get: vi.fn().mockReturnValue(null) };

    mockController = createMockController();
    mockProject = createMockProject();

    await TestBed.configureTestingModule({
      imports: [ImportProjectDialogComponent, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { controller: mockController, project: mockProject } },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: UploadServiceService, useValue: mockUploadServiceService },
        { provide: ProjectNameValidator, useValue: mockValidator },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportProjectDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should receive controller data via MAT_DIALOG_DATA', () => {
      expect(component.data).toBeDefined();
      expect(component.data.controller).toEqual(mockController);
    });

    it('should have controller property set', () => {
      expect(component.controller).toEqual(mockController);
    });

    it('should initialize with default state', () => {
      expect(component.isImportEnabled()).toBe(false);
      expect(component.isFinishEnabled()).toBe(false);
      expect(component.isDeleteVisible()).toBe(false);
      expect(component.isFirstStepCompleted()).toBe(false);
      expect(component.uploadProgress()).toBe(0);
    });

    it('should initialize projectName with empty string', () => {
      expect(component.projectName()).toBe('');
    });
  });

  describe('uploadProjectFile', () => {
    it('should extract filename without extension as project name', () => {
      const mockEvent = {
        target: {
          files: [{ name: 'myproject.gns3project' }],
        },
      };

      component.uploadProjectFile(mockEvent);

      expect(component.projectName()).toBe('myproject');
    });

    it('should enable import button after file selection', () => {
      const mockEvent = {
        target: {
          files: [{ name: 'test.gns3p' }],
        },
      };

      component.uploadProjectFile(mockEvent);

      expect(component.isImportEnabled()).toBe(true);
    });

    it('should show delete button after file selection', () => {
      const mockEvent = {
        target: {
          files: [{ name: 'test.gns3p' }],
        },
      };

      component.uploadProjectFile(mockEvent);

      expect(component.isDeleteVisible()).toBe(true);
    });
  });

  describe('onDeleteClick', () => {
    beforeEach(() => {
      component.uploader = createMockUploader();
    });

    it('should remove file from uploader queue', () => {
      component.uploader.queue = [{ remove: vi.fn() } as any];

      component.onDeleteClick();

      expect(component.uploader.queue.length).toBe(0);
    });

    it('should disable import button', () => {
      component.isImportEnabled.set(true);

      component.onDeleteClick();

      expect(component.isImportEnabled()).toBe(false);
    });

    it('should hide delete button', () => {
      component.isDeleteVisible.set(true);

      component.onDeleteClick();

      expect(component.isDeleteVisible()).toBe(false);
    });

    it('should clear project name field', () => {
      component.projectName.set('TestProject');

      component.onDeleteClick();

      expect(component.projectName()).toBe('');
    });
  });

  describe('onNoClick', () => {
    it('should cancel all uploads', () => {
      component.uploader = createMockUploader();

      component.onNoClick();

      expect(component.uploader.cancelAll).toHaveBeenCalled();
    });

    it('should close dialog with false', () => {
      component.uploader = createMockUploader();

      component.onNoClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('onFinishClick', () => {
    it('should close dialog with false', () => {
      component.onFinishClick();
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('prepareUploadPath', () => {
    beforeEach(() => {
      component.uploader = createMockUploader();
      component.projectName.set('TestProject');
    });

    it('should generate uuid for upload', () => {
      component.prepareUploadPath();

      expect(component.uuid()).toBeDefined();
      expect(component.uuid().length).toBe(36); // UUID format
    });

    it('should call projectService.getUploadPath with correct parameters', () => {
      component.prepareUploadPath();

      expect(mockProjectService.getUploadPath).toHaveBeenCalledWith(component.controller, component.uuid(), 'TestProject');
    });

    it('should return upload URL from projectService', () => {
      const result = component.prepareUploadPath();

      expect(result).toBe('http://localhost:3080/v4/upload/project/uuid/name');
    });
  });

  describe('onImportClick with invalid form', () => {
    it('should set submitted to true when name is empty', () => {
      component.projectName.set('');
      component.submitted.set(false);

      component.onImportClick();

      expect(component.submitted()).toBe(true);
    });

    it('should set submitted to true when name has invalid characters', () => {
      mockValidator.get.mockReturnValue({ invalidName: true });
      component.projectName.set('Invalid@Name');
      component.submitted.set(false);

      component.onImportClick();

      expect(component.submitted()).toBe(true);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show error toaster when projectService.list fails', async () => {
      mockProjectService.list.mockReturnValue(throwError(() => ({ error: { message: 'List failed' } })));
      component.projectName.set('TestProject');

      component.onImportClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('List failed');
    });

    it('should use fallback message when list error has no message', async () => {
      mockProjectService.list.mockReturnValue(throwError(() => ({})));
      component.projectName.set('TestProject');

      component.onImportClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to list projects');
    });
  });
});
