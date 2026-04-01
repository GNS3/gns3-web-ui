import { PreferencesComponent } from '../preferences.component';
import { describe, it, expect } from 'vitest';

describe('BuiltInPreferencesComponent', () => {
  it('should be defined', () => {
    expect(PreferencesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(PreferencesComponent.name).toBe('PreferencesComponent');
  });
});
