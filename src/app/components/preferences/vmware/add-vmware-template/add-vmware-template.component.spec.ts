import { AddVmwareTemplateComponent } from './add-vmware-template.component';
import { describe, it, expect } from 'vitest';

describe('AddVmwareTemplateComponent', () => {
  it('should be defined', () => {
    expect(AddVmwareTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AddVmwareTemplateComponent.name).toBe('AddVmwareTemplateComponent');
  });
});
