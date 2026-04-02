import { describe, it, expect } from 'vitest';
import { EditTextActionComponent } from './edit-text-action.component';

describe('EditTextActionComponent', () => {
  describe('prototype methods', () => {
    it('should have editText method', () => {
      expect(typeof (EditTextActionComponent.prototype as any).editText).toBe('function');
    });
  });
});
