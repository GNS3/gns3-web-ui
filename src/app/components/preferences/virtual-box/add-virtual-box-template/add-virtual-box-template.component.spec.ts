import { AddVirtualBoxTemplateComponent } from './add-virtual-box-template.component';
import { describe, it, expect } from 'vitest';

describe('AddVirtualBoxTemplateComponent', () => {
  it('should be defined', () => {
    expect(AddVirtualBoxTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AddVirtualBoxTemplateComponent.name).toBe('AddVirtualBoxTemplateComponent');
  });
});
