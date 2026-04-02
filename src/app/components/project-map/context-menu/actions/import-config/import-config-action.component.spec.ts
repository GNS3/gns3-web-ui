import { describe, it, expect } from 'vitest';
import { ImportConfigActionComponent } from './import-config-action.component';

describe('ImportConfigActionComponent', () => {
  describe('prototype methods', () => {
    it('should have triggerClick method', () => {
      expect(typeof (ImportConfigActionComponent.prototype as any).triggerClick).toBe('function');
    });

    it('should have importConfig method', () => {
      expect(typeof (ImportConfigActionComponent.prototype as any).importConfig).toBe('function');
    });
  });
});
