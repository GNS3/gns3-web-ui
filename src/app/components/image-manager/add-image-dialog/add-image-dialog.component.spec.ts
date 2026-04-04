import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AddImageDialogComponent } from './add-image-dialog.component';
import { BackgroundUploadService } from '@services/background-upload.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AddImageDialogComponent', () => {
  let component: AddImageDialogComponent;
  let fixture: ComponentFixture<AddImageDialogComponent>;
  let mockBackgroundUploadService: any;
  let mockToasterService: any;
  let mockDialogRef: any;
  let mockController: Controller;

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
    }) as Controller;

  beforeEach(async () => {
    mockController = createMockController();

    mockBackgroundUploadService = {
      queueFile: vi.fn(),
    };

    mockToasterService = {
      success: vi.fn(),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddImageDialogComponent, MatDialogModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockController },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: BackgroundUploadService, useValue: mockBackgroundUploadService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddImageDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(component.isInstallAppliance).toBe(false);
      expect(component.install_appliance).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should assign controller from dialog data', () => {
      fixture.detectChanges();

      expect(component.controller).toEqual(mockController);
    });
  });

  describe('onFilesSelected', () => {
    it('should queue single file when one file is selected', () => {
      fixture.detectChanges();

      const mockFile = new File(['test'], 'test.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile] },
      } as unknown as Event;

      component.onFilesSelected(event);

      expect(mockBackgroundUploadService.queueFile).toHaveBeenCalledWith(
        mockController,
        mockFile,
        false,
      );
    });

    it('should queue multiple files when multiple files are selected', () => {
      fixture.detectChanges();

      const mockFile1 = new File(['test1'], 'test1.img', { type: 'image/x-img' });
      const mockFile2 = new File(['test2'], 'test2.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile1, mockFile2] },
      } as unknown as Event;

      component.onFilesSelected(event);

      expect(mockBackgroundUploadService.queueFile).toHaveBeenCalledTimes(2);
      expect(mockBackgroundUploadService.queueFile).toHaveBeenNthCalledWith(
        1,
        mockController,
        mockFile1,
        false,
      );
      expect(mockBackgroundUploadService.queueFile).toHaveBeenNthCalledWith(
        2,
        mockController,
        mockFile2,
        false,
      );
    });

    it('should show success toast for single file', () => {
      fixture.detectChanges();

      const mockFile = new File(['test'], 'test.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile] },
      } as unknown as Event;

      component.onFilesSelected(event);

      expect(mockToasterService.success).toHaveBeenCalledWith(
        '1 file queued — uploading in the background',
      );
    });

    it('should show success toast for multiple files', () => {
      fixture.detectChanges();

      const mockFile1 = new File(['test1'], 'test1.img', { type: 'image/x-img' });
      const mockFile2 = new File(['test2'], 'test2.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile1, mockFile2] },
      } as unknown as Event;

      component.onFilesSelected(event);

      expect(mockToasterService.success).toHaveBeenCalledWith(
        '2 files queued — uploading in the background',
      );
    });

    it('should close dialog with true after file selection', () => {
      fixture.detectChanges();

      const mockFile = new File(['test'], 'test.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile] },
      } as unknown as Event;

      component.onFilesSelected(event);

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should clear input value after selection', () => {
      fixture.detectChanges();

      const mockFile = new File(['test'], 'test.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile], value: 'test-value' },
      } as unknown as Event;

      component.onFilesSelected(event);

      expect((event.target as HTMLInputElement).value).toBe('');
    });

    it('should not queue files when no files are selected', () => {
      fixture.detectChanges();

      const event = {
        target: { files: null },
      } as unknown as Event;

      component.onFilesSelected(event);

      expect(mockBackgroundUploadService.queueFile).not.toHaveBeenCalled();
      expect(mockToasterService.success).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not queue files when files array is empty', () => {
      fixture.detectChanges();

      const event = {
        target: { files: [] },
      } as unknown as Event;

      component.onFilesSelected(event);

      expect(mockBackgroundUploadService.queueFile).not.toHaveBeenCalled();
      expect(mockToasterService.success).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should use install_appliance flag when queuing files', () => {
      fixture.detectChanges();
      component.install_appliance = true;

      const mockFile = new File(['test'], 'test.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile] },
      } as unknown as Event;

      component.onFilesSelected(event);

      expect(mockBackgroundUploadService.queueFile).toHaveBeenCalledWith(
        mockController,
        mockFile,
        true,
      );
    });
  });

  describe('selectInstallApplianceOption', () => {
    it('should set install_appliance to true when value is true', () => {
      fixture.detectChanges();

      component.selectInstallApplianceOption({ value: true });

      expect(component.install_appliance).toBe(true);
      expect(component.isInstallAppliance).toBe(false);
    });

    it('should set install_appliance to false when value is false', () => {
      fixture.detectChanges();
      component.install_appliance = true;

      component.selectInstallApplianceOption({ value: false });

      expect(component.install_appliance).toBe(false);
    });
  });

  describe('closeDialog', () => {
    it('should close dialog with false', () => {
      fixture.detectChanges();

      component.closeDialog();

      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
