import { describe, it, expect } from 'vitest';
import { DeleteGroupDialogComponent } from './delete-group-dialog.component';

describe('DeleteGroupDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have onCancel method', () => {
      expect(typeof (DeleteGroupDialogComponent.prototype as any).onCancel).toBe('function');
    });

    it('should have onDelete method', () => {
      expect(typeof (DeleteGroupDialogComponent.prototype as any).onDelete).toBe('function');
    });
  });
});
