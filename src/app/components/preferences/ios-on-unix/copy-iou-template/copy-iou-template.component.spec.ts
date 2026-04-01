import { CopyIouTemplateComponent } from './copy-iou-template.component';
import { describe, it, expect } from 'vitest';

describe('CopyIouTemplateComponent', () => {
  it('should be defined', () => {
    expect(CopyIouTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(CopyIouTemplateComponent.name).toBe('CopyIouTemplateComponent');
  });
});
