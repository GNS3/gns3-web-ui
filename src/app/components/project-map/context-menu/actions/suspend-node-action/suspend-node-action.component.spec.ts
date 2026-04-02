import { describe, it, expect } from 'vitest';
import { SuspendNodeActionComponent } from './suspend-node-action.component';

describe('SuspendNodeActionComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnChanges method', () => {
      expect(typeof (SuspendNodeActionComponent.prototype as any).ngOnChanges).toBe('function');
    });

    it('should have suspendNodes method', () => {
      expect(typeof (SuspendNodeActionComponent.prototype as any).suspendNodes).toBe('function');
    });
  });
});
