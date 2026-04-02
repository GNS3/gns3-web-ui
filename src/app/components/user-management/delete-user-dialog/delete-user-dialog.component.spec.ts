import { describe, it, expect } from 'vitest';
import { DeleteUserDialogComponent } from './delete-user-dialog.component';

describe('DeleteUserDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have onCancel method', () => {
      expect(typeof (DeleteUserDialogComponent.prototype as any).onCancel).toBe('function');
    });

    it('should have onDelete method', () => {
      expect(typeof (DeleteUserDialogComponent.prototype as any).onDelete).toBe('function');
    });
  });
});
