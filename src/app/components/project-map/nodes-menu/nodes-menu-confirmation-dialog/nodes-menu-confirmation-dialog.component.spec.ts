import { describe, it, expect } from 'vitest';
import { NodesMenuConfirmationDialogComponent } from './nodes-menu-confirmation-dialog.component';

describe('NodesMenuConfirmationDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (NodesMenuConfirmationDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have confirmAction method', () => {
      expect(typeof (NodesMenuConfirmationDialogComponent.prototype as any).confirmAction).toBe('function');
    });
  });
});
