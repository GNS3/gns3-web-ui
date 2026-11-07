import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DeleteAllImageFilesDialogComponent } from './deleteallfiles-dialog.component';
import { ImageManagerService } from '@services/image-manager.service';
import { DockerService } from '@services/docker.service';
import { ControllerError } from '@services/http-controller.service';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DeleteAllImageFilesDialogComponent', () => {
  let component: DeleteAllImageFilesDialogComponent;
  let fixture: ComponentFixture<DeleteAllImageFilesDialogComponent>;
  let mockImageManagerService: any;
  let mockDockerService: any;
  let mockDialogRef: any;
  let mockChangeDetectorRef: any;

  const mockDeleteData = {
    controller: { id: 1, name: 'Test Controller' },
    deleteFilesPaths: [{ filename: 'image1.img' }, { filename: 'image2.img' }],
    autoStart: false,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockImageManagerService = {
      deleteFile: vi.fn(),
    };

    mockDockerService = {
      deleteImage: vi.fn(),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DeleteAllImageFilesDialogComponent, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
      providers: [
        { provide: ImageManagerService, useValue: mockImageManagerService },
        { provide: DockerService, useValue: mockDockerService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDeleteData },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAllImageFilesDialogComponent);
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

    it('should receive deleteData from dialog', () => {
      expect(component.deleteData).toEqual(mockDeleteData);
    });

    it('should initialize in the deleting state', () => {
      expect(component.isDelete).toBe(true);
      expect(component.isUsedFiles).toBe(false);
    });

    it('should initialize with empty results', () => {
      expect(component.failedMessages).toEqual([]);
      expect(component.deletedCount).toBe(0);
    });
  });

  describe('Template Rendering', () => {
    it('should show progress without duplicate confirmation actions', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.delete-files__title')).toBeTruthy();
      expect(compiled.querySelector('mat-spinner')).toBeTruthy();
      expect(compiled.querySelector('button')).toBeFalsy();
    });
  });

  describe('deleteAll()', () => {
    it('should set isDelete to true when called', () => {
      mockImageManagerService.deleteFile.mockReturnValue(of(null));
      component.deleteAll();
      expect(component.isDelete).toBe(true);
    });

    it('should call deleteFile for each file path', () => {
      mockImageManagerService.deleteFile.mockReturnValue(of(null));
      component.deleteAll();
      expect(mockImageManagerService.deleteFile).toHaveBeenCalledTimes(2);
      expect(mockImageManagerService.deleteFile).toHaveBeenCalledWith(mockDeleteData.controller, 'image1.img');
      expect(mockImageManagerService.deleteFile).toHaveBeenCalledWith(mockDeleteData.controller, 'image2.img');
    });

    it('should show spinner while deleting', () => {
      // Verify the state that causes spinner to show: isDelete true, isUsedFiles false
      component.isDelete = true;
      component.isUsedFiles = false;
      // For OnPush components, we need to trigger markForCheck for internal state changes
      (component as any).cd.markForCheck();
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('mat-spinner')).toBeTruthy();
    });
  });

  describe('deleteFile() - all files deleted successfully', () => {
    it('should set isUsedFiles to true after successful deletion', () => {
      mockImageManagerService.deleteFile.mockReturnValue(of(null));
      component.deleteFile();
      // Since of(null) emits synchronously, the subscription callback should have run
      fixture.detectChanges();
      expect(component.isUsedFiles).toBe(true);
    });

    it('should have no failed messages when all files deleted', () => {
      mockImageManagerService.deleteFile.mockReturnValue(of(null));
      component.deleteFile();
      fixture.detectChanges();
      expect(component.failedMessages.length).toBe(0);
    });

    it('should count every deleted file', () => {
      mockImageManagerService.deleteFile.mockReturnValue(of(null));
      component.deleteFile();
      fixture.detectChanges();
      expect(component.deletedCount).toBe(2);
    });
  });

  describe('deleteFile() - some files fail to delete', () => {
    it('should collect server messages from ControllerError (transformed by HttpController)', () => {
      // HttpController converts HTTP errors to ControllerError: the server message lives
      // in .message and there is no .error property.
      const controllerError = new ControllerError("Image 'image1.img' is used by one or more templates: FRR-qemu");
      mockImageManagerService.deleteFile.mockReturnValueOnce(of(controllerError)).mockReturnValueOnce(of(null));
      component.deleteFile();
      fixture.detectChanges();
      expect(component.failedMessages.length).toBe(1);
      expect(component.failedMessages[0]).toBe("Image 'image1.img' is used by one or more templates: FRR-qemu");
      expect(component.deletedCount).toBe(1);
    });

    it('should collect server messages from a raw HttpErrorResponse', () => {
      // Error paths that bypass ControllerErrorHandler (e.g. failed token refresh) emit
      // the raw HttpErrorResponse, where the server message lives in error.message.
      const httpError = { error: { message: 'Image is used by one or more projects: test-project' } };
      mockImageManagerService.deleteFile.mockReturnValueOnce(of(httpError)).mockReturnValueOnce(of(null));
      component.deleteFile();
      fixture.detectChanges();
      expect(component.failedMessages.length).toBe(1);
      expect(component.failedMessages[0]).toBe('Image is used by one or more projects: test-project');
    });

    it('should fall back to a generic message when the error has no message', () => {
      mockImageManagerService.deleteFile.mockReturnValueOnce(of({})).mockReturnValueOnce(of(null));
      component.deleteFile();
      fixture.detectChanges();
      expect(component.failedMessages).toEqual(['Failed to delete image']);
    });

    it('should render the server messages in the dialog list', () => {
      const controllerError = new ControllerError("Image 'image1.img' is used by one or more templates: FRR-qemu");
      mockImageManagerService.deleteFile.mockReturnValueOnce(of(controllerError)).mockReturnValueOnce(of(null));
      component.deleteFile();
      fixture.detectChanges();
      const listItems = fixture.nativeElement.querySelectorAll('.delete-files__list-item');
      expect(listItems.length).toBe(1);
      expect(listItems[0].textContent).toContain("Image 'image1.img' is used by one or more templates: FRR-qemu");
    });

    it('should show error title when some files cannot be deleted', () => {
      const controllerError = new ControllerError('File in use');
      mockImageManagerService.deleteFile.mockReturnValueOnce(of(controllerError)).mockReturnValueOnce(of(null));
      component.deleteFile();
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.delete-files__error-title')).toBeTruthy();
    });

    it('should show success count for deleted files', () => {
      const controllerError = new ControllerError('File in use');
      mockImageManagerService.deleteFile.mockReturnValueOnce(of(controllerError)).mockReturnValueOnce(of(null));
      component.deleteFile();
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.delete-files__success-title').textContent).toContain(
        '1 Images deleted successfully'
      );
    });

    it('should update state after deletion completes', () => {
      mockImageManagerService.deleteFile.mockReturnValue(of(null));
      component.deleteFile();
      // Verify the state is properly set after deletion
      expect(component.isDelete).toBe(true);
      expect(component.isUsedFiles).toBe(true);
      expect(component.failedMessages.length).toBe(0);
      expect(component.deletedCount).toBe(2);
    });
  });

  describe('Close button', () => {
    it('should close dialog when close button is clicked after deletion completes', () => {
      const controllerError = new ControllerError('File in use');
      mockImageManagerService.deleteFile.mockReturnValueOnce(of(controllerError)).mockReturnValueOnce(of(null));
      component.deleteFile();
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const closeButton = compiled.querySelector('button[color="primary"]');
      closeButton.click();
      fixture.detectChanges();
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('deleteFile() - docker images', () => {
    it('deletes docker rows through the daemon and file rows through the image service', () => {
      mockImageManagerService.deleteFile.mockReturnValue(of(null));
      mockDockerService.deleteImage.mockReturnValue(of(undefined));
      component.deleteData.computeId = 'local';
      component.deleteData.deleteFilesPaths = [
        { rowType: 'docker', dockerImage: 'debian:latest', filename: 'debian:latest' },
        { rowType: 'image', filename: 'image1.img', path: '/images/QEMU/image1.img' },
      ];

      component.deleteFile();
      fixture.detectChanges();

      expect(mockDockerService.deleteImage).toHaveBeenCalledWith(
        mockDeleteData.controller,
        'local',
        'debian:latest',
        false
      );
      expect(mockImageManagerService.deleteFile).toHaveBeenCalledWith(mockDeleteData.controller, 'image1.img');
      expect(component.deletedCount).toBe(2);
      expect(component.failedMessages).toEqual([]);
    });

    it('keeps an image used by a container and reports the daemon message', () => {
      const conflict = new ControllerError('image is being used by a container');
      mockDockerService.deleteImage.mockReturnValue(throwError(() => conflict));
      component.deleteData.deleteFilesPaths = [
        { rowType: 'docker', dockerImage: 'debian:latest', filename: 'debian:latest' },
      ];

      component.deleteFile();
      fixture.detectChanges();

      expect(component.deletedCount).toBe(0);
      expect(component.failedMessages).toEqual(['image is being used by a container']);
    });
  });

  describe('deleteFile() error handling', () => {
    it('should have cd (ChangeDetectorRef) injected', () => {
      expect(component['cd']).toBeDefined();
    });
  });
});
