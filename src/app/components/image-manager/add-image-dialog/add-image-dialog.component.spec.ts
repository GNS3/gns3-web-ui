import { of, Subject, throwError } from 'rxjs';
import { ImageChecksumService } from '@services/image-checksum.service';
import { ImageManagerService } from '@services/image-manager.service';
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
  const checksum = '900150983cd24fb0d6963f7d28e17f72';
  let checksumService: any;
  let imageManager: any;

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

  beforeEach(async () => {
    mockController = createMockController();
    checksumService = { calculate: vi.fn(() => of({ progress: 100, checksum })) };
    imageManager = {
      getCompatibilityCatalog: vi.fn(() => of({ image_sizes: [], has_unknown_sizes: true })),
      checkCompatibility: vi.fn(() => of([{ checksum, matches: [] }])),
    };

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
        { provide: ImageChecksumService, useValue: checksumService },
        { provide: ImageManagerService, useValue: imageManager },
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

  function startCompatibilityCheck(file = new File(['abc'], 'custom.qcow2')) {
    component.selectedFiles = [file];
    component.nextStep();
    component.selectInstallApplianceOption({ value: true });
  }

  it.each([{}, { image_sizes: ['3'], has_unknown_sizes: false }, { image_sizes: [], has_unknown_sizes: null }])(
    'rejects malformed catalogs instead of claiming the image is incompatible',
    (catalog) => {
      imageManager.getCompatibilityCatalog.mockReturnValue(of(catalog));
      startCompatibilityCheck();
      expect(component.compatibilityState).toBe('error');
      expect(component.compatibilityResults).toEqual([]);
      expect(checksumService.calculate).not.toHaveBeenCalled();
    }
  );

  it('skips hashing and reports a size mismatch immediately for a 5 GB custom image', () => {
    imageManager.getCompatibilityCatalog.mockReturnValue(of({ image_sizes: [42], has_unknown_sizes: false }));
    const file = new File(['abc'], 'custom.qcow2');
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 * 1024 });
    startCompatibilityCheck(file);
    fixture.detectChanges();
    expect(component.compatibilityState).toBe('ready');
    expect(checksumService.calculate).not.toHaveBeenCalled();
    expect(imageManager.checkCompatibility).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'No appliance definition found in the server catalog for this image'
    );
  });

  it('still hashes a size candidate regardless of its filename', () => {
    imageManager.getCompatibilityCatalog.mockReturnValue(of({ image_sizes: [3], has_unknown_sizes: false }));
    startCompatibilityCheck(new File(['abc'], 'renamed-custom.qcow2'));
    expect(checksumService.calculate).toHaveBeenCalledOnce();
    expect(imageManager.checkCompatibility).toHaveBeenCalledOnce();
  });

  it.each([
    [{ status: 404 }, 'Restart the updated GNS3 server'],
    [{ originalError: { status: 403 } }, 'permissions'],
    [{ status: 0 }, 'could not be reached'],
    [{ name: 'TimeoutError' }, 'timed out after 30 seconds'],
  ])('reports the catalog failure before reading any file', (error, message) => {
    imageManager.getCompatibilityCatalog.mockReturnValue(throwError(() => error));
    startCompatibilityCheck();
    expect(component.compatibilityError).toContain(message);
    expect(checksumService.calculate).not.toHaveBeenCalled();
  });

  it('reports file read errors separately from catalog mismatches', () => {
    checksumService.calculate.mockReturnValue(throwError(() => new Error('The selected file could not be read.')));
    startCompatibilityCheck();
    expect(component.compatibilityError).toContain('The selected file could not be read.');
    expect(component.compatibilityResults).toEqual([]);
  });

  it('checks on Yes and shows a custom-image warning before allowing upload', () => {
    startCompatibilityCheck();
    fixture.detectChanges();
    expect(imageManager.checkCompatibility).toHaveBeenCalledWith(mockController, [checksum]);
    expect(fixture.nativeElement.textContent).toContain('No matching appliance definition was found');
    expect(component.compatibilityState).toBe('ready');
    expect(mockBackgroundUploadService.queueFile).not.toHaveBeenCalled();
  });

  it('blocks upload during hashing and cancels it when No is selected', () => {
    const progress = new Subject<any>();
    checksumService.calculate.mockReturnValue(progress);
    startCompatibilityCheck();
    component.uploadFiles();
    expect(component.compatibilityState).toBe('checking');
    expect(mockBackgroundUploadService.queueFile).not.toHaveBeenCalled();
    component.selectInstallApplianceOption({ value: false });
    progress.next({ progress: 100, checksum });
    expect(imageManager.checkCompatibility).not.toHaveBeenCalled();
    component.uploadFiles();
    expect(mockBackgroundUploadService.queueFile).toHaveBeenCalledWith(
      mockController,
      component.selectedFiles[0],
      false,
      ''
    );
  });

  it('reports failed checks and supports retry without uploading', () => {
    imageManager.checkCompatibility.mockReturnValueOnce(throwError(() => new Error('Unavailable')));
    startCompatibilityCheck();
    component.uploadFiles();
    expect(component.compatibilityState).toBe('error');
    expect(mockBackgroundUploadService.queueFile).not.toHaveBeenCalled();
    component.checkCompatibility();
    expect(component.compatibilityState).toBe('ready');
  });

  it('shows matched appliances and missing dependencies', () => {
    imageManager.checkCompatibility.mockReturnValue(
      of([
        {
          checksum,
          matches: [{ name: 'Router', version: '1', missing_images: ['disk.img'], downloadable_images: ['boot.img'] }],
        },
      ])
    );
    startCompatibilityCheck(new File(['abc'], 'router.qcow2'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Match found: Router (1)');
    expect(fixture.nativeElement.textContent).toContain('Required images still missing: disk.img');
    expect(fixture.nativeElement.textContent).toContain('boot.img');
  });

  it('cancels a pending lookup when going Back and rechecks changed files', () => {
    const lookup = new Subject<any>();
    imageManager.checkCompatibility.mockReturnValueOnce(lookup);
    startCompatibilityCheck(new File(['abc'], 'old.qcow2'));
    component.back();
    lookup.next([{ checksum, matches: [] }]);
    expect(component.compatibilityResults).toEqual([]);
    component.onFilesSelected({ target: { files: [new File(['abc'], 'new.qcow2')], value: '' } } as unknown as Event);
    component.nextStep();
    expect(component.compatibilityResults[0].filename).toBe('new.qcow2');
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(component.step).toBe('files');
      expect(component.install_appliance).toBe(false);
    });
  });

  describe('dialog data', () => {
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
      component.nextStep();
      component.uploadFiles();

      expect(mockBackgroundUploadService.queueFile).toHaveBeenCalledWith(mockController, mockFile, false, '');
    });

    it('should queue multiple files when multiple files are selected', () => {
      fixture.detectChanges();

      const mockFile1 = new File(['test1'], 'test1.img', { type: 'image/x-img' });
      const mockFile2 = new File(['test2'], 'test2.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile1, mockFile2] },
      } as unknown as Event;

      component.onFilesSelected(event);
      component.nextStep();
      component.uploadFiles();

      expect(mockBackgroundUploadService.queueFile).toHaveBeenCalledTimes(2);
      expect(mockBackgroundUploadService.queueFile).toHaveBeenNthCalledWith(1, mockController, mockFile1, false, '');
      expect(mockBackgroundUploadService.queueFile).toHaveBeenNthCalledWith(2, mockController, mockFile2, false, '');
    });

    it('should show success toast for single file', () => {
      fixture.detectChanges();

      const mockFile = new File(['test'], 'test.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile] },
      } as unknown as Event;

      component.onFilesSelected(event);
      component.nextStep();
      component.uploadFiles();

      expect(mockToasterService.success).toHaveBeenCalledWith('1 file queued — uploading in the background');
    });

    it('should show success toast for multiple files', () => {
      fixture.detectChanges();

      const mockFile1 = new File(['test1'], 'test1.img', { type: 'image/x-img' });
      const mockFile2 = new File(['test2'], 'test2.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile1, mockFile2] },
      } as unknown as Event;

      component.onFilesSelected(event);
      component.nextStep();
      component.uploadFiles();

      expect(mockToasterService.success).toHaveBeenCalledWith('2 files queued — uploading in the background');
    });

    it('should close dialog with true after Upload', () => {
      fixture.detectChanges();

      const mockFile = new File(['test'], 'test.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile] },
      } as unknown as Event;

      component.onFilesSelected(event);
      component.nextStep();
      component.uploadFiles();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should clear input value after selection', () => {
      fixture.detectChanges();

      const mockFile = new File(['test'], 'test.img', { type: 'image/x-img' });
      const event = {
        target: { files: [mockFile], value: 'test-value' },
      } as unknown as Event;

      component.onFilesSelected(event);
      component.nextStep();
      component.uploadFiles();

      expect((event.target as HTMLInputElement).value).toBe('');
    });

    it('should not queue files when no files are selected', () => {
      fixture.detectChanges();

      const event = {
        target: { files: null },
      } as unknown as Event;

      component.onFilesSelected(event);
      component.nextStep();
      component.uploadFiles();

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
      component.nextStep();
      component.uploadFiles();

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
      component.nextStep();
      component.uploadFiles();

      expect(mockBackgroundUploadService.queueFile).toHaveBeenCalledWith(mockController, mockFile, true, '');
    });
  });

  it('waits for confirmation and passes the selected subfolder to background uploads', () => {
    const file = new File(['test'], 'router.qcow2');
    component.onFilesSelected({ target: { files: [file], value: '' } } as unknown as Event);
    expect(mockBackgroundUploadService.queueFile).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
    component.subdirectory = 'Cisco/IOSv 15.9';
    component.nextStep();
    component.uploadFiles();
    expect(mockBackgroundUploadService.queueFile).toHaveBeenCalledWith(mockController, file, false, 'Cisco/IOSv 15.9');
  });

  it.each([
    '../escape',
    '/absolute',
    'Cisco//IOS',
    'C:\\temp',
    '.hidden',
    'Cisco/..',
    'Cisco/NUL',
    'lib',
    'trailing.',
    'Vendor.tmp',
    'Vendor.md5sum',
    'Vendor\n',
    'Vendor\r',
  ])('blocks invalid subfolder %s without queuing uploads', (folder) => {
    component.selectedFiles = [new File(['test'], 'router.qcow2')];
    component.subdirectory = folder;
    expect(component.subdirectoryError).toBeTruthy();
    component.nextStep();
    component.uploadFiles();
    expect(mockBackgroundUploadService.queueFile).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('shows the folder error and disables Next while typing an invalid path', async () => {
    component.selectedFiles = [new File(['test'], 'router.qcow2')];
    fixture.detectChanges();
    await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[matInput]');
    input.value = '../escape';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain('relative folder names');
    const nextButton: HTMLButtonElement = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find((button) => button.textContent.trim() === 'Next') as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);
    input.value = 'Vendor/Version';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    expect(nextButton.disabled).toBe(false);
  });

  it('opens at file selection and requires files before Next', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Select image file(s) to upload');
    const next = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
      (button) => button.textContent.trim() === 'Next'
    );
    expect(next.disabled).toBe(true);
    component.nextStep();
    expect(component.step).toBe('files');
    expect(mockBackgroundUploadService.queueFile).not.toHaveBeenCalled();
  });

  it('cannot start an upload before the appliance step', () => {
    component.selectedFiles = [new File(['test'], 'router.qcow2')];
    component.uploadFiles();
    expect(mockBackgroundUploadService.queueFile).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it.each(['files', 'appliances'] as const)('allows Cancel on the %s step without uploading', (step) => {
    component.selectedFiles = [new File(['test'], 'router.qcow2')];
    component.step = step;
    fixture.detectChanges();
    const cancel = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
      (button) => button.textContent.trim() === 'Cancel'
    );
    cancel.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    expect(mockBackgroundUploadService.queueFile).not.toHaveBeenCalled();
  });

  describe('selectInstallApplianceOption', () => {
    it('should set install_appliance to true when value is true', () => {
      fixture.detectChanges();

      component.selectInstallApplianceOption({ value: true });

      expect(component.install_appliance).toBe(true);
      expect(component.step).toBe('files');
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
