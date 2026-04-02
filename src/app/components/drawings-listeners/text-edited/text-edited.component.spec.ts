import { describe, it, expect } from 'vitest';
import { TextEditedComponent } from './text-edited.component';

describe('TextEditedComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (TextEditedComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onTextEdited method', () => {
      expect(typeof (TextEditedComponent.prototype as any).onTextEdited).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (TextEditedComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });
});
