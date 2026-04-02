import { describe, it, expect } from 'vitest';
import { ModelTypeHelpDialogComponent } from './model-type-help-dialog.component';

describe('ModelTypeHelpDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have close method', () => {
      expect(typeof (ModelTypeHelpDialogComponent.prototype as any).close).toBe('function');
    });
  });
});
