import { QemuImageCreatorComponent } from './qemu-image-creator.component';
import { describe, it, expect } from 'vitest';

describe('QemuImageCreatorComponent', () => {
  it('should be defined', () => {
    expect(QemuImageCreatorComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(QemuImageCreatorComponent.name).toBe('QemuImageCreatorComponent');
  });
});
