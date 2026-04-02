import { describe, it, expect } from 'vitest';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfirmationDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (ConfirmationDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have onYesClick method', () => {
      expect(typeof (ConfirmationDialogComponent.prototype as any).onYesClick).toBe('function');
    });
  });
});
