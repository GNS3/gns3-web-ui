import { InstalledSoftwareComponent } from './installed-software.component';
import { describe, it, expect } from 'vitest';

describe('InstalledSoftwareComponent', () => {
  it('should be defined', () => {
    expect(InstalledSoftwareComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(InstalledSoftwareComponent.name).toBe('InstalledSoftwareComponent');
  });

  // Note: May require InstalledSoftwareService
});
