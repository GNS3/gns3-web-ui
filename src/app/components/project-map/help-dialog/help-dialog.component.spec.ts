import { describe, it, expect } from 'vitest';
import { HelpDialogComponent } from './help-dialog.component';

describe('HelpDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have onCloseClick method', () => {
      expect(typeof (HelpDialogComponent.prototype as any).onCloseClick).toBe('function');
    });
  });
});
