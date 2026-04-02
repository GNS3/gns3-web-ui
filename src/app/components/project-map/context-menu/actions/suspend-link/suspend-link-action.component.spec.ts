import { describe, it, expect } from 'vitest';
import { SuspendLinkActionComponent } from './suspend-link-action.component';

describe('SuspendLinkActionComponent', () => {
  describe('prototype methods', () => {
    it('should have suspendLink method', () => {
      expect(typeof (SuspendLinkActionComponent.prototype as any).suspendLink).toBe('function');
    });
  });
});
