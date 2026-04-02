import { describe, it, expect } from 'vitest';
import { ChangeSymbolDialogComponent } from './change-symbol-dialog.component';

describe('ChangeSymbolDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ChangeSymbolDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have symbolChanged method', () => {
      expect(typeof (ChangeSymbolDialogComponent.prototype as any).symbolChanged).toBe('function');
    });

    it('should have onCloseClick method', () => {
      expect(typeof (ChangeSymbolDialogComponent.prototype as any).onCloseClick).toBe('function');
    });

    it('should have onSelectClick method', () => {
      expect(typeof (ChangeSymbolDialogComponent.prototype as any).onSelectClick).toBe('function');
    });
  });
});
