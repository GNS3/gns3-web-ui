import { describe, it, expect } from 'vitest';
import { HttpConsoleActionComponent } from './http-console-action.component';

describe('HttpConsoleActionComponent', () => {
  describe('prototype methods', () => {
    it('should have openConsole method', () => {
      expect(typeof (HttpConsoleActionComponent.prototype as any).openConsole).toBe('function');
    });
  });
});
