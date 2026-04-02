import { describe, it, expect } from 'vitest';
import { RemoveToGroupDialogComponent } from './remove-to-group-dialog.component';

describe('RemoveToGroupDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have onCancel method', () => {
      expect(typeof (RemoveToGroupDialogComponent.prototype as any).onCancel).toBe('function');
    });

    it('should have onConfirm method', () => {
      expect(typeof (RemoveToGroupDialogComponent.prototype as any).onConfirm).toBe('function');
    });
  });
});
