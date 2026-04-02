import { describe, it, expect } from 'vitest';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have onConfirm method', () => {
      expect(typeof (ConfirmDialogComponent.prototype as any).onConfirm).toBe('function');
    });

    it('should have onCancel method', () => {
      expect(typeof (ConfirmDialogComponent.prototype as any).onCancel).toBe('function');
    });
  });

  describe('exported types', () => {
    it('should export ConfirmDialogData interface', () => {
      const data: ConfirmDialogData = {
        title: 'Test',
        message: 'Test message',
        items: [{ name: 'item1', description: 'desc' }],
        confirmText: 'Confirm',
        cancelText: 'Cancel',
      };
      expect(data.title).toBe('Test');
      expect(data.message).toBe('Test message');
    });
  });
});
