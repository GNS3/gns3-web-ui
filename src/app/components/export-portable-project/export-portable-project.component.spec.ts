import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ExportPortableProjectComponent } from './export-portable-project.component';
import { ProjectService } from '@services/project.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ExportPortableProjectComponent', () => {
  let component: ExportPortableProjectComponent;
  let fixture: ComponentFixture<ExportPortableProjectComponent>;

  let mockProjectService: any;
  let mockDialogRef: any;
  let mockController: Controller;
  let mockProject: Project;

  const compression_methods = [
    { id: 1, value: 'zstd', name: 'Zstandard' },
    { id: 2, value: 'gzip', name: 'GZIP' },
    { id: 3, value: 'bz2', name: 'BZIP2' },
    { id: 4, value: 'xz', name: 'XZ' },
    { id: 5, value: 'zip', name: 'ZIP' },
  ];

  const compression_level = [
    {
      name: 'zstd',
      value: 3,
      selectionValues: [1, 3, 5, 10, 15, 19],
    },
    {
      name: 'gzip',
      value: 6,
      selectionValues: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: 'bz2',
      value: 6,
      selectionValues: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: 'xz',
      value: 6,
      selectionValues: [1, 2, 3, 4, 5, 6],
    },
    {
      name: 'zip',
      value: 6,
      selectionValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
  ];

  beforeEach(async () => {
    mockProjectService = {
      getCompression: vi.fn().mockReturnValue(compression_methods),
      getCompressionLevel: vi.fn().mockReturnValue(compression_level),
      getexportPortableProjectPath: vi.fn().mockReturnValue('http://localhost:3080/v4/projects/proj1/export'),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    mockController = {
      id: 1,
      authToken: 'test-token',
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
      imports: [ExportPortableProjectComponent, MatDialogModule],
      providers: [
        { provide: ProjectService, useValue: mockProjectService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { controllerDetails: mockController, projectDetails: mockProject } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportPortableProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have isExport signal initialized to false', () => {
      expect(component.isExport()).toBe(false);
    });

    it('should have fileName set from project name with .gns3project extension', () => {
      expect(component.fileName).toBe('Test Project.gns3project');
    });
  });

  describe('ngOnInit', () => {
    it('should load compression_methods from projectService', () => {
      expect(mockProjectService.getCompression).toHaveBeenCalled();
      expect(component.compression_methods).toEqual(compression_methods);
    });

    it('should load compression_level from projectService', () => {
      expect(mockProjectService.getCompressionLevel).toHaveBeenCalled();
      expect(component.compression_level).toEqual(compression_level);
    });

    it('should select compression at index 4 (zip) by default', () => {
      const zipMethod = compression_methods[4];
      const zipLevel = compression_level.find((l) => l.name === zipMethod.value);

      expect(component.export_project_form.get('compression')?.value).toEqual(zipMethod);
      expect(component.export_project_form.get('compression_level')?.value).toBe(zipLevel?.value);
      expect(component.compression_filter_value).toEqual(zipLevel?.selectionValues);
    });
  });

  describe('formControls', () => {
    it('should create form with compression field', () => {
      const compressionField = component.export_project_form.get('compression');
      expect(compressionField).toBeDefined();
    });

    it('should create form with include_base_image checkbox set to false', () => {
      const field = component.export_project_form.get('include_base_image');
      expect(field?.value).toBe(false);
    });

    it('should create form with include_snapshots checkbox set to false', () => {
      const field = component.export_project_form.get('include_snapshots');
      expect(field?.value).toBe(false);
    });

    it('should create form with reset_mac_address checkbox set to false', () => {
      const field = component.export_project_form.get('reset_mac_address');
      expect(field?.value).toBe(false);
    });
  });

  describe('selectCompression', () => {
    it('should update compression_level form value when selecting a compression method', () => {
      const gzipMethod = compression_methods[1]; // gzip
      const gzipLevel = compression_level.find((l) => l.name === gzipMethod.value);

      component.selectCompression({ value: gzipMethod });

      expect(component.export_project_form.get('compression_level')?.value).toBe(gzipLevel?.value);
    });

    it('should update compression_filter_value with correct selection values', () => {
      const gzipMethod = compression_methods[1]; // gzip
      const gzipLevel = compression_level.find((l) => l.name === gzipMethod.value);

      component.selectCompression({ value: gzipMethod });

      expect(component.compression_filter_value).toEqual(gzipLevel?.selectionValues);
    });

    it('should not update compression_filter_value when compression level not found', () => {
      const unknownMethod = { id: 99, value: 'unknown', name: 'Unknown' };

      // compression_filter_value was set by ngOnInit to zip's values [0-9]
      const previousValue = [...component.compression_filter_value];

      component.selectCompression({ value: unknownMethod as any });

      // Should remain unchanged since level was not found
      expect(component.compression_filter_value).toEqual(previousValue);
    });
  });

  describe('exportPortableProject', () => {
    beforeEach(() => {
      vi.spyOn(window, 'location', 'get').mockReturnValue({ assign: vi.fn() } as any);
    });

    it('should set isExport signal to true', () => {
      component.exportPortableProject();

      expect(component.isExport()).toBe(true);
    });

    it('should close the dialog', () => {
      component.exportPortableProject();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should call getexportPortableProjectPath with correct arguments', () => {
      component.export_project_form.patchValue({
        compression: compression_methods[0], // zstd
        compression_level: 3,
        include_base_image: true,
        include_snapshots: false,
        reset_mac_address: true,
      });

      component.exportPortableProject();

      expect(mockProjectService.getexportPortableProjectPath).toHaveBeenCalledWith(
        mockController,
        mockProject.project_id,
        expect.objectContaining({
          compression: 'zstd',
          compression_level: 3,
          include_base_image: true,
          include_snapshots: false,
          reset_mac_address: true,
        })
      );
    });

    it('should assign export URL to window.location', () => {
      const exportPath = 'http://localhost:3080/v4/projects/proj1/export';
      mockProjectService.getexportPortableProjectPath.mockReturnValue(exportPath);

      component.exportPortableProject();

      expect(window.location.assign).toHaveBeenCalledWith(exportPath);
    });

    it('should use zstd as default compression when compression is an object', () => {
      component.export_project_form.patchValue({
        compression: compression_methods[0], // zstd object
        compression_level: 3,
        include_base_image: false,
        include_snapshots: false,
        reset_mac_address: false,
      });

      component.exportPortableProject();

      expect(mockProjectService.getexportPortableProjectPath).toHaveBeenCalledWith(
        mockController,
        mockProject.project_id,
        expect.objectContaining({
          compression: 'zstd',
        })
      );
    });

    it('should use zstd as default compression when compression value is undefined', () => {
      component.export_project_form.patchValue({
        compression: undefined,
        compression_level: 3,
        include_base_image: false,
        include_snapshots: false,
        reset_mac_address: false,
      });

      component.exportPortableProject();

      expect(mockProjectService.getexportPortableProjectPath).toHaveBeenCalledWith(
        mockController,
        mockProject.project_id,
        expect.objectContaining({
          compression: 'zstd',
        })
      );
    });
  });

  describe('Inputs via MAT_DIALOG_DATA', () => {
    it('should receive controller from dialog data', () => {
      expect(component.controller).toBe(mockController);
    });

    it('should receive project from dialog data', () => {
      expect(component.project).toBe(mockProject);
    });
  });

  describe('dialogRef', () => {
    it('should use injected dialogRef', () => {
      expect(component.dialogRef).toBe(mockDialogRef);
    });

    it('should close dialog when close button is clicked', () => {
      const closeBtn = fixture.nativeElement.querySelector('.export-portable-project__close-btn');
      closeBtn.click();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
