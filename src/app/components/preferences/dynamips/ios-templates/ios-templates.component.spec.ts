import { IosTemplatesComponent } from './ios-templates.component';
import { describe, it, expect } from 'vitest';

describe('IosTemplatesComponent', () => {
  it('should be defined', () => {
    expect(IosTemplatesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(IosTemplatesComponent.name).toBe('IosTemplatesComponent');
  });
});
