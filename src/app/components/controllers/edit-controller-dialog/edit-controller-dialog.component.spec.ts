import { describe, it, expect } from 'vitest';
import { EditControllerDialogComponent } from './edit-controller-dialog.component';

describe('EditControllerDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (EditControllerDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onSave method', () => {
      expect(typeof (EditControllerDialogComponent.prototype as any).onSave).toBe('function');
    });

    it('should have onCancel method', () => {
      expect(typeof (EditControllerDialogComponent.prototype as any).onCancel).toBe('function');
    });
  });
});
