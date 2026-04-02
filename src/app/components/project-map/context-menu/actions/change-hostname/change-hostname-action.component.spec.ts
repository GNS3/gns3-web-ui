import { describe, it, expect } from 'vitest';
import { ChangeHostnameActionComponent } from './change-hostname-action.component';

describe('ChangeHostnameActionComponent', () => {
  describe('prototype methods', () => {
    it('should have changeHostname method', () => {
      expect(typeof (ChangeHostnameActionComponent.prototype as any).changeHostname).toBe('function');
    });
  });
});
