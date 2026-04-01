import { DirectLinkComponent } from './direct-link.component';
import { describe, it, expect } from 'vitest';

describe('DirectLinkComponent', () => {
  it('should be defined', () => {
    expect(DirectLinkComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(DirectLinkComponent.name).toBe('DirectLinkComponent');
  });

  // Note: May require ProjectService
});
