import { VirtualBoxPreferencesComponent } from './virtual-box-preferences.component';
import { describe, it, expect } from 'vitest';

describe('VirtualBoxPreferencesComponent', () => {
  it('should be defined', () => {
    expect(VirtualBoxPreferencesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(VirtualBoxPreferencesComponent.name).toBe('VirtualBoxPreferencesComponent');
  });
});
