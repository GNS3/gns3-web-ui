import { describe, it, expect } from 'vitest';
import { EditConfigActionComponent } from './edit-config-action.component';

describe('EditConfigActionComponent', () => {
  describe('prototype methods', () => {
    it('should have editConfig method', () => {
      expect(typeof (EditConfigActionComponent.prototype as any).editConfig).toBe('function');
    });
  });
});
