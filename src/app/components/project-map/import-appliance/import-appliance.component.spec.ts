import { ImportApplianceComponent } from './import-appliance.component';
import { describe, it, expect } from 'vitest';

describe('ImportApplianceComponent', () => {
  it('should be defined', () => {
    expect(ImportApplianceComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ImportApplianceComponent.name).toBe('ImportApplianceComponent');
  });

  // Note: May require ApplianceService and ProjectService
});
