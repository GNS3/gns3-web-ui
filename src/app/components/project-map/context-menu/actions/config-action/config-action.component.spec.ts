import { describe, it, expect } from 'vitest';
import { ConfigActionComponent } from './config-action.component';

describe('ConfigActionComponent', () => {
  describe('prototype methods', () => {
    it('should have configureNode method', () => {
      expect(typeof (ConfigActionComponent.prototype as any).configureNode).toBe('function');
    });
  });
});
