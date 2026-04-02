import { describe, it, expect } from 'vitest';
import { ChangeHostnameDialogComponent } from './change-hostname-dialog.component';

describe('ChangeHostnameDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ChangeHostnameDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ChangeHostnameDialogComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ChangeHostnameDialogComponent.prototype as any).onCancelClick).toBe('function');
    });
  });
});
