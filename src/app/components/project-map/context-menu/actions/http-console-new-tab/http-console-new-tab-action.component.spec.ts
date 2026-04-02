import { describe, it, expect } from 'vitest';
import { HttpConsoleNewTabActionComponent } from './http-console-new-tab-action.component';

describe('HttpConsoleNewTabActionComponent', () => {
  describe('prototype methods', () => {
    it('should have openConsole method', () => {
      expect(typeof (HttpConsoleNewTabActionComponent.prototype as any).openConsole).toBe('function');
    });
  });
});
