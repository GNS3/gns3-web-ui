import { describe, it, expect } from 'vitest';
import { AlignHorizontallyActionComponent } from './align-horizontally.component';

describe('AlignHorizontallyActionComponent', () => {
  describe('prototype methods', () => {
    it('should have alignHorizontally method', () => {
      expect(typeof (AlignHorizontallyActionComponent.prototype as any).alignHorizontally).toBe('function');
    });
  });
});
