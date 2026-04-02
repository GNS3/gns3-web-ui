import { describe, it, expect } from 'vitest';
import { ShowNodeActionComponent } from './show-node-action.component';

describe('ShowNodeActionComponent', () => {
  describe('prototype methods', () => {
    it('should have showNode method', () => {
      expect(typeof (ShowNodeActionComponent.prototype as any).showNode).toBe('function');
    });
  });
});
