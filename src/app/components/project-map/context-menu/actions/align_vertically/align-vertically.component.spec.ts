import { describe, it, expect } from 'vitest';
import { AlignVerticallyActionComponent } from './align-vertically.component';

describe('AlignVerticallyActionComponent', () => {
  describe('prototype methods', () => {
    it('should have alignVertically method', () => {
      expect(typeof (AlignVerticallyActionComponent.prototype as any).alignVertically).toBe('function');
    });
  });
});
