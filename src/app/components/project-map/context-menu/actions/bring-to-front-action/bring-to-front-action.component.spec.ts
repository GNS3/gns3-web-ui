import { describe, it, expect } from 'vitest';
import { BringToFrontActionComponent } from './bring-to-front-action.component';

describe('BringToFrontActionComponent', () => {
  describe('prototype methods', () => {
    it('should have bringToFront method', () => {
      expect(typeof (BringToFrontActionComponent.prototype as any).bringToFront).toBe('function');
    });
  });
});
