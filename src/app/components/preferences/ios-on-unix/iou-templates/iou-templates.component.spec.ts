import { IouTemplatesComponent } from './iou-templates.component';
import { describe, it, expect } from 'vitest';

describe('IouTemplatesComponent', () => {
  it('should be defined', () => {
    expect(IouTemplatesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(IouTemplatesComponent.name).toBe('IouTemplatesComponent');
  });
});
