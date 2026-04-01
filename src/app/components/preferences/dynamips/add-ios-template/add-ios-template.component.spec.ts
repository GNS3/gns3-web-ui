import { AddIosTemplateComponent } from './add-ios-template.component';
import { describe, it, expect } from 'vitest';

describe('AddIosTemplateComponent', () => {
  it('should be defined', () => {
    expect(AddIosTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AddIosTemplateComponent.name).toBe('AddIosTemplateComponent');
  });
});
