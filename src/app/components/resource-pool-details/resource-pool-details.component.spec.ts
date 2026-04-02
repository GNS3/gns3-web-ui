import { describe, it, expect } from 'vitest';
import { ResourcePoolDetailsComponent } from './resource-pool-details.component';

describe('ResourcePoolDetailsComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ResourcePoolDetailsComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onUpdate method', () => {
      expect(typeof (ResourcePoolDetailsComponent.prototype as any).onUpdate).toBe('function');
    });

    it('should have addResource method', () => {
      expect(typeof (ResourcePoolDetailsComponent.prototype as any).addResource).toBe('function');
    });

    it('should have deleteResource method', () => {
      expect(typeof (ResourcePoolDetailsComponent.prototype as any).deleteResource).toBe('function');
    });
  });
});
