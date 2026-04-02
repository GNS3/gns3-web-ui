import { describe, it, expect } from 'vitest';
import { ChangeSymbolActionComponent } from './change-symbol-action.component';

describe('ChangeSymbolActionComponent', () => {
  describe('prototype methods', () => {
    it('should have changeSymbol method', () => {
      expect(typeof (ChangeSymbolActionComponent.prototype as any).changeSymbol).toBe('function');
    });
  });
});
