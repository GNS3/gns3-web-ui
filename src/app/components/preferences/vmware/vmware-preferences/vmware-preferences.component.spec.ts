import { VmwarePreferencesComponent } from './vmware-preferences.component';
import { describe, it, expect } from 'vitest';

describe('VmwarePreferencesComponent', () => {
  it('should be defined', () => {
    expect(VmwarePreferencesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(VmwarePreferencesComponent.name).toBe('VmwarePreferencesComponent');
  });
});
