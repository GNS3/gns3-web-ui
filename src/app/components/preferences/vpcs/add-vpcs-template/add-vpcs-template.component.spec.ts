import { AddVpcsTemplateComponent } from './add-vpcs-template.component';
import { describe, it, expect } from 'vitest';

describe('AddVpcsTemplateComponent', () => {
  it('should be defined', () => {
    expect(AddVpcsTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AddVpcsTemplateComponent.name).toBe('AddVpcsTemplateComponent');
  });
});
