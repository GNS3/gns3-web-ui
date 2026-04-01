import { QemuVmTemplatesComponent } from './qemu-vm-templates.component';
import { describe, it, expect } from 'vitest';

describe('QemuVmTemplatesComponent', () => {
  it('should be defined', () => {
    expect(QemuVmTemplatesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(QemuVmTemplatesComponent.name).toBe('QemuVmTemplatesComponent');
  });
});
