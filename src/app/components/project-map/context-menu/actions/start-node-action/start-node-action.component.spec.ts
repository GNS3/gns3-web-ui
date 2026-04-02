import { describe, it, expect } from 'vitest';
import { StartNodeActionComponent } from './start-node-action.component';

describe('StartNodeActionComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnChanges method', () => {
      expect(typeof (StartNodeActionComponent.prototype as any).ngOnChanges).toBe('function');
    });

    it('should have startNodes method', () => {
      expect(typeof (StartNodeActionComponent.prototype as any).startNodes).toBe('function');
    });
  });
});
