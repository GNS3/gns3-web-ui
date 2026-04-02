import { describe, it, expect } from 'vitest';
import { BundledControllerFinderComponent } from './bundled-controller-finder.component';

describe('BundledControllerFinderComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (BundledControllerFinderComponent.prototype as any).ngOnInit).toBe('function');
    });
  });
});
