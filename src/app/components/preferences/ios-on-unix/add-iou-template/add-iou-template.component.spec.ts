import { AddIouTemplateComponent } from './add-iou-template.component';
import { describe, it, expect } from 'vitest';

describe('AddIouTemplateComponent', () => {
  it('should be defined', () => {
    expect(AddIouTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AddIouTemplateComponent.name).toBe('AddIouTemplateComponent');
  });
});
