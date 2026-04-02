import { describe, it, expect } from 'vitest';
import { IsolateNodeActionComponent } from './isolate-node-action.component';

describe('IsolateNodeActionComponent', () => {
  describe('prototype methods', () => {
    it('should have isolate method', () => {
      expect(typeof (IsolateNodeActionComponent.prototype as any).isolate).toBe('function');
    });
  });
});
