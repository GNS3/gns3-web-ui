import { describe, it, expect } from 'vitest';
import { StopNodeActionComponent } from './stop-node-action.component';

describe('StopNodeActionComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnChanges method', () => {
      expect(typeof (StopNodeActionComponent.prototype as any).ngOnChanges).toBe('function');
    });

    it('should have stopNodes method', () => {
      expect(typeof (StopNodeActionComponent.prototype as any).stopNodes).toBe('function');
    });
  });
});
