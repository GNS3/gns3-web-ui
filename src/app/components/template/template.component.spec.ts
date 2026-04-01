import { TemplateComponent } from './template.component';
import { describe, it, expect } from 'vitest';

describe('TemplateComponent', () => {
  it('should be defined', () => {
    expect(TemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(TemplateComponent.name).toBe('TemplateComponent');
  });
});
