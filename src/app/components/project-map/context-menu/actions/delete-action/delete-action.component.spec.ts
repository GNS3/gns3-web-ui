import { describe, it, expect } from 'vitest';
import { DeleteActionComponent } from './delete-action.component';

describe('DeleteActionComponent', () => {
  describe('prototype methods', () => {
    it('should have confirmDelete method', () => {
      expect(typeof (DeleteActionComponent.prototype as any).confirmDelete).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof (DeleteActionComponent.prototype as any).delete).toBe('function');
    });
  });
});
