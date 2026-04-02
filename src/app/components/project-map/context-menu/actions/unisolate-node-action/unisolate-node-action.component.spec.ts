import { describe, it, expect } from 'vitest';
import { UnisolateNodeActionComponent } from './unisolate-node-action.component';

describe('UnisolateNodeActionComponent', () => {
  describe('prototype methods', () => {
    it('should have unisolate method', () => {
      expect(typeof (UnisolateNodeActionComponent.prototype as any).unisolate).toBe('function');
    });
  });
});
