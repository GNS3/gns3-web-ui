import { describe, it, expect } from 'vitest';
import { DeleteResourcePoolComponent } from './delete-resource-pool.component';

describe('DeleteResourcePoolComponent', () => {
  describe('prototype methods', () => {
    it('should have onCancel method', () => {
      expect(typeof (DeleteResourcePoolComponent.prototype as any).onCancel).toBe('function');
    });

    it('should have onDelete method', () => {
      expect(typeof (DeleteResourcePoolComponent.prototype as any).onDelete).toBe('function');
    });
  });
});
