import { describe, it, expect } from 'vitest';
import { ProjectMapLockConfirmationDialogComponent } from './project-map-lock-confirmation-dialog.component';

describe('ProjectMapLockConfirmationDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ProjectMapLockConfirmationDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have confirmAction method', () => {
      expect(typeof (ProjectMapLockConfirmationDialogComponent.prototype as any).confirmAction).toBe('function');
    });
  });
});
