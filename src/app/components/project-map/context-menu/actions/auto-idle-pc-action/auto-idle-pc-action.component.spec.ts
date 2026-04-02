import { describe, it, expect } from 'vitest';
import { AutoIdlePcActionComponent } from './auto-idle-pc-action.component';

describe('AutoIdlePcActionComponent', () => {
  describe('prototype methods', () => {
    it('should have autoIdlePC method', () => {
      expect(typeof (AutoIdlePcActionComponent.prototype as any).autoIdlePC).toBe('function');
    });
  });
});
