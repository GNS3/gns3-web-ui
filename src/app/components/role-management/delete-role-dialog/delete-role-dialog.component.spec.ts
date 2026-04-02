import { describe, it, expect } from 'vitest';
import { DeleteRoleDialogComponent } from './delete-role-dialog.component';

describe('DeleteRoleDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have onCancel method', () => {
      expect(typeof (DeleteRoleDialogComponent.prototype as any).onCancel).toBe('function');
    });

    it('should have onDelete method', () => {
      expect(typeof (DeleteRoleDialogComponent.prototype as any).onDelete).toBe('function');
    });
  });
});
