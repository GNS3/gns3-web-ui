import { describe, it, expect } from 'vitest';
import { DuplicateActionComponent } from './duplicate-action.component';

describe('DuplicateActionComponent', () => {
  describe('prototype methods', () => {
    it('should have duplicate method', () => {
      expect(typeof (DuplicateActionComponent.prototype as any).duplicate).toBe('function');
    });
  });
});
