import { describe, it, expect } from 'vitest';
import { DeleteAceDialogComponent } from './delete-ace-dialog.component';

describe('DeleteAceDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have onCancel method', () => {
      expect(typeof (DeleteAceDialogComponent.prototype as any).onCancel).toBe('function');
    });

    it('should have onDelete method', () => {
      expect(typeof (DeleteAceDialogComponent.prototype as any).onDelete).toBe('function');
    });
  });
});
