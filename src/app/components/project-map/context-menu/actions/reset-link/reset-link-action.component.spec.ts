import { describe, it, expect } from 'vitest';
import { ResetLinkActionComponent } from './reset-link-action.component';

describe('ResetLinkActionComponent', () => {
  describe('prototype methods', () => {
    it('should have resetLink method', () => {
      expect(typeof (ResetLinkActionComponent.prototype as any).resetLink).toBe('function');
    });
  });
});
