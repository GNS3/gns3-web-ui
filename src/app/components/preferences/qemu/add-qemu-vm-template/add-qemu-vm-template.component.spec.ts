import { AddQemuVmTemplateComponent } from './add-qemu-vm-template.component';
import { describe, it, expect } from 'vitest';

describe('AddQemuVmTemplateComponent', () => {
  it('should be defined', () => {
    expect(AddQemuVmTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AddQemuVmTemplateComponent.name).toBe('AddQemuVmTemplateComponent');
  });
});
