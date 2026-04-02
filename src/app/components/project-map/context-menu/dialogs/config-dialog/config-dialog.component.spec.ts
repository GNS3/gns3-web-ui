import { describe, it, expect } from 'vitest';
import { ConfigDialogComponent } from './config-dialog.component';

describe('ConfigDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have close method', () => {
      expect(typeof (ConfigDialogComponent.prototype as any).close).toBe('function');
    });

    it('should have onClose method', () => {
      expect(typeof (ConfigDialogComponent.prototype as any).onClose).toBe('function');
    });
  });
});
