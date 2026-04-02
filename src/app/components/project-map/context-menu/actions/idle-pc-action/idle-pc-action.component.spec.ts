import { describe, it, expect } from 'vitest';
import { IdlePcActionComponent } from './idle-pc-action.component';

describe('IdlePcActionComponent', () => {
  describe('prototype methods', () => {
    it('should have idlePC method', () => {
      expect(typeof (IdlePcActionComponent.prototype as any).idlePC).toBe('function');
    });
  });
});
