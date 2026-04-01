import { QemuPreferencesComponent } from './qemu-preferences.component';
import { describe, it, expect } from 'vitest';

describe('QemuPreferencesComponent', () => {
  it('should be defined', () => {
    expect(QemuPreferencesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(QemuPreferencesComponent.name).toBe('QemuPreferencesComponent');
  });
});
