import { CopyIosTemplateComponent } from './copy-ios-template.component';
import { describe, it, expect } from 'vitest';

describe('CopyIosTemplateComponent', () => {
  it('should be defined', () => {
    expect(CopyIosTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(CopyIosTemplateComponent.name).toBe('CopyIosTemplateComponent');
  });
});
