import { describe, it, expect } from 'vitest';
import { EditStyleActionComponent } from './edit-style-action.component';

describe('EditStyleActionComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnChanges method', () => {
      expect(typeof (EditStyleActionComponent.prototype as any).ngOnChanges).toBe('function');
    });

    it('should have editStyle method', () => {
      expect(typeof (EditStyleActionComponent.prototype as any).editStyle).toBe('function');
    });
  });
});
