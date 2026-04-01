import { VmwareTemplatesComponent } from './vmware-templates.component';
import { describe, it, expect } from 'vitest';

describe('VmwareTemplatesComponent', () => {
  it('should be defined', () => {
    expect(VmwareTemplatesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(VmwareTemplatesComponent.name).toBe('VmwareTemplatesComponent');
  });
});
