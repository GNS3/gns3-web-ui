import { VpcsPreferencesComponent } from './vpcs-preferences.component';
import { describe, it, expect } from 'vitest';

describe('VpcsPreferencesComponent', () => {
  it('should be defined', () => {
    expect(VpcsPreferencesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(VpcsPreferencesComponent.name).toBe('VpcsPreferencesComponent');
  });
});
