import { ConfigureCustomAdaptersDialogComponent } from './configure-custom-adapters.component';
import { describe, it, expect } from 'vitest';

describe('ConfigureCustomAdaptersDialogComponent', () => {
  it('should be defined', () => {
    expect(ConfigureCustomAdaptersDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfigureCustomAdaptersDialogComponent.name).toBe('ConfigureCustomAdaptersDialogComponent');
  });
});
