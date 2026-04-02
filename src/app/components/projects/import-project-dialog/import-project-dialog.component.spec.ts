import { describe, it, expect } from 'vitest';
import { ImportProjectDialogComponent } from './import-project-dialog.component';

describe('ImportProjectDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ImportProjectDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have uploadProjectFile method', () => {
      expect(typeof (ImportProjectDialogComponent.prototype as any).uploadProjectFile).toBe('function');
    });

    it('should have onImportClick method', () => {
      expect(typeof (ImportProjectDialogComponent.prototype as any).onImportClick).toBe('function');
    });

    it('should have importProject method', () => {
      expect(typeof (ImportProjectDialogComponent.prototype as any).importProject).toBe('function');
    });

    it('should have openConfirmationDialog method', () => {
      expect(typeof (ImportProjectDialogComponent.prototype as any).openConfirmationDialog).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (ImportProjectDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have onFinishClick method', () => {
      expect(typeof (ImportProjectDialogComponent.prototype as any).onFinishClick).toBe('function');
    });

    it('should have onDeleteClick method', () => {
      expect(typeof (ImportProjectDialogComponent.prototype as any).onDeleteClick).toBe('function');
    });

    it('should have prepareUploadPath method', () => {
      expect(typeof (ImportProjectDialogComponent.prototype as any).prepareUploadPath).toBe('function');
    });

    it('should have cancelUploading method', () => {
      expect(typeof (ImportProjectDialogComponent.prototype as any).cancelUploading).toBe('function');
    });

    it('should have form getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(ImportProjectDialogComponent.prototype, 'form')?.get).toBe('function');
    });
  });
});
