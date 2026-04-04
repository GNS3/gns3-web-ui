import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DeleteAllImageFilesDialogComponent } from './deleteallfiles-dialog.component';
import { ImageManagerService } from '@services/image-manager.service';
import { ToasterService } from '@services/toaster.service';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DeleteAllImageFilesDialogComponent', () => {
  let component: DeleteAllImageFilesDialogComponent;
  let fixture: ComponentFixture<DeleteAllImageFilesDialogComponent>;
  let mockImageManagerService: any;
  let mockDialogRef: any;
  let mockChangeDetectorRef: any;

  const mockDeleteData = {
    controller: { id: 1, name: 'Test Controller' },
    deleteFilesPaths: [{ filename: 'image1.img' }, { filename: 'image2.img' }],
  };

  beforeEach(async () => {
    mockImageManagerService = {
      deleteFile: vi.fn(),
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
        { provide: ToasterService, useValue: { success: vi.fn(), error: vi.fn() } },
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

    it('should initialize with isDelete false and isUsedFiles false', () => {
      expect(component.isDelete).toBe(false);
      expect(component.isUsedFiles).toBe(false);
    });

    it('should initialize with empty arrays for deleteFliesDetails and fileNotDeleted', () => {
      expect(component.deleteFliesDetails).toEqual([]);
      expect(component.fileNotDeleted).toEqual([]);
    });
  });

  describe('Template Rendering', () => {
    it('should show confirmation view with file list initially', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.delete-files__title')).toBeTruthy();
      expect(compiled.querySelector('.delete-files__list')).toBeTruthy();
      expect(compiled.querySelector('button').textContent).toContain('Delete');
    });

    it('should display all file names in the list', () => {
      const compiled = fixture.nativeElement;
      const listItems = compiled.querySelectorAll('.delete-files__list-item');
      expect(listItems.length).toBe(2);
      expect(listItems[0].textContent).toContain('image1.img');
      expect(listItems[1].textContent).toContain('image2.img');
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

    it('should have empty deleteFliesDetails when all files deleted', () => {
      mockImageManagerService.deleteFile.mockReturnValue(of(null));
      component.deleteFile();
      fixture.detectChanges();
      expect((component.deleteFliesDetails as any).length).toBe(0);
    });

    it('should have fileNotDeleted count equal to total files', () => {
      mockImageManagerService.deleteFile.mockReturnValue(of(null));
      component.deleteFile();
      fixture.detectChanges();
      expect((component.fileNotDeleted as any).length).toBe(2);
    });
  });

  describe('deleteFile() - some files fail to delete', () => {
    it('should populate deleteFliesDetails with error responses', () => {
      const errorResponse = { error: { message: 'File in use by template' } };
      mockImageManagerService.deleteFile.mockReturnValueOnce(of(errorResponse)).mockReturnValueOnce(of(null));
      component.deleteFile();
      fixture.detectChanges();
      expect((component.deleteFliesDetails as any).length).toBe(1);
      expect((component.deleteFliesDetails as any)[0]).toEqual(errorResponse);
    });

    it('should show error title when some files cannot be deleted', () => {
      const errorResponse = { error: { message: 'File in use' } };
      mockImageManagerService.deleteFile.mockReturnValueOnce(of(errorResponse)).mockReturnValueOnce(of(null));
      component.deleteFile();
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.delete-files__error-title')).toBeTruthy();
    });

    it('should show success count for deleted files', () => {
      const errorResponse = { error: { message: 'File in use' } };
      mockImageManagerService.deleteFile.mockReturnValueOnce(of(errorResponse)).mockReturnValueOnce(of(null));
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
      expect((component.deleteFliesDetails as any).length).toBe(0);
      expect((component.fileNotDeleted as any).length).toBe(2);
    });
  });

  describe('Close button', () => {
    it('should close dialog when close button is clicked after deletion completes', () => {
      const errorResponse = { error: { message: 'File in use' } };
      mockImageManagerService.deleteFile.mockReturnValueOnce(of(errorResponse)).mockReturnValueOnce(of(null));
      component.deleteFile();
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const closeButton = compiled.querySelector('button[color="primary"]');
      closeButton.click();
      fixture.detectChanges();
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
