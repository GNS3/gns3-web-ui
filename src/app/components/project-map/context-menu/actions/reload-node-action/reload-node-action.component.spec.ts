import { describe, it, expect } from 'vitest';
import { ReloadNodeActionComponent } from './reload-node-action.component';

describe('ReloadNodeActionComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ReloadNodeActionComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have reloadNodes method', () => {
      expect(typeof (ReloadNodeActionComponent.prototype as any).reloadNodes).toBe('function');
    });
  });
});
