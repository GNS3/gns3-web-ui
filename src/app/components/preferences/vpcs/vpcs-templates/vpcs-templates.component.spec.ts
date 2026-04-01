import { VpcsTemplatesComponent } from './vpcs-templates.component';
import { describe, it, expect } from 'vitest';

describe('VpcsTemplatesComponent', () => {
  it('should be defined', () => {
    expect(VpcsTemplatesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(VpcsTemplatesComponent.name).toBe('VpcsTemplatesComponent');
  });
});
