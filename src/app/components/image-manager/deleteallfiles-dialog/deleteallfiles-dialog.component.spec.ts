import { describe, it, expect } from 'vitest';
import { DeleteAllImageFilesDialogComponent } from './deleteallfiles-dialog.component';

describe('DeleteAllImageFilesDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have deleteAll method', () => {
      expect(typeof (DeleteAllImageFilesDialogComponent.prototype as any).deleteAll).toBe('function');
    });

    it('should have deleteFile method', () => {
      expect(typeof (DeleteAllImageFilesDialogComponent.prototype as any).deleteFile).toBe('function');
    });
  });
});
