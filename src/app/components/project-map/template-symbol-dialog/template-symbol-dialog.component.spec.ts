import { describe, it, expect } from 'vitest';
import { TemplateSymbolDialogComponent, TemplateSymbolDialogData } from './template-symbol-dialog.component';

describe('TemplateSymbolDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (TemplateSymbolDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have symbolChanged method', () => {
      expect(typeof (TemplateSymbolDialogComponent.prototype as any).symbolChanged).toBe('function');
    });

    it('should have onCloseClick method', () => {
      expect(typeof (TemplateSymbolDialogComponent.prototype as any).onCloseClick).toBe('function');
    });

    it('should have onSelectClick method', () => {
      expect(typeof (TemplateSymbolDialogComponent.prototype as any).onSelectClick).toBe('function');
    });
  });

  describe('exported types', () => {
    it('should export TemplateSymbolDialogData interface', () => {
      const data: TemplateSymbolDialogData = {
        controller: {} as any,
        symbol: 'test-symbol',
      };
      expect(data.symbol).toBe('test-symbol');
    });
  });
});
