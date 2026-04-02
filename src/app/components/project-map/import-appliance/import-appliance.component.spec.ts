import { describe, it, expect } from 'vitest';
import { ImportApplianceComponent } from './import-appliance.component';

describe('ImportApplianceComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ImportApplianceComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have uploadAppliance method', () => {
      expect(typeof (ImportApplianceComponent.prototype as any).uploadAppliance).toBe('function');
    });
  });
});
