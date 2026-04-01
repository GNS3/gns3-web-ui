import { GeneralPreferencesComponent } from './general-preferences.component';
import { describe, it, expect } from 'vitest';

describe('GeneralPreferencesComponent', () => {
  it('should be defined', () => {
    expect(GeneralPreferencesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(GeneralPreferencesComponent.name).toBe('GeneralPreferencesComponent');
  });

  // Note: May require SettingsService and other dependencies
});
