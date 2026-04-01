import { DynamipsPreferencesComponent } from './dynamips-preferences.component';
import { describe, it, expect } from 'vitest';

describe('DynamipsPreferencesComponent', () => {
  it('should be defined', () => {
    expect(DynamipsPreferencesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(DynamipsPreferencesComponent.name).toBe('DynamipsPreferencesComponent');
  });
});
