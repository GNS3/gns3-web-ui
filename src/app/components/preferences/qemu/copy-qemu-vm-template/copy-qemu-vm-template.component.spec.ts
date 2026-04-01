import { CopyQemuVmTemplateComponent } from './copy-qemu-vm-template.component';
import { describe, it, expect } from 'vitest';

describe('CopyQemuVmTemplateComponent', () => {
  it('should be defined', () => {
    expect(CopyQemuVmTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(CopyQemuVmTemplateComponent.name).toBe('CopyQemuVmTemplateComponent');
  });
});
