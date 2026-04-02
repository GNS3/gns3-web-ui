import { describe, it, expect } from 'vitest';
import { ExportConfigActionComponent } from './export-config-action.component';

describe('ExportConfigActionComponent', () => {
  describe('prototype methods', () => {
    it('should have exportConfig method', () => {
      expect(typeof (ExportConfigActionComponent.prototype as any).exportConfig).toBe('function');
    });
  });
});
