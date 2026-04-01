import { VirtualBoxTemplatesComponent } from './virtual-box-templates.component';
import { describe, it, expect } from 'vitest';

describe('VirtualBoxTemplatesComponent', () => {
  it('should be defined', () => {
    expect(VirtualBoxTemplatesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(VirtualBoxTemplatesComponent.name).toBe('VirtualBoxTemplatesComponent');
  });
});
