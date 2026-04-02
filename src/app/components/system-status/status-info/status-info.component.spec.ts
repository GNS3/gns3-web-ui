import { describe, it, expect } from 'vitest';
import { StatusInfoComponent } from './status-info.component';

describe('StatusInfoComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (StatusInfoComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getStatistics method', () => {
      expect(typeof (StatusInfoComponent.prototype as any).getStatistics).toBe('function');
    });
  });
});
