import { describe, it, expect } from 'vitest';
import { IdlePCDialogComponent } from './idle-pc-dialog.component';

describe('IdlePCDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (IdlePCDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getTooltip method', () => {
      expect(typeof (IdlePCDialogComponent.prototype as any).getTooltip).toBe('function');
    });

    it('should have onCompute method', () => {
      expect(typeof (IdlePCDialogComponent.prototype as any).onCompute).toBe('function');
    });

    it('should have onClose method', () => {
      expect(typeof (IdlePCDialogComponent.prototype as any).onClose).toBe('function');
    });

    it('should have onApply method', () => {
      expect(typeof (IdlePCDialogComponent.prototype as any).onApply).toBe('function');
    });
  });
});
