import { ProjectMapMenuComponent } from './project-map-menu.component';
import { describe, it, expect } from 'vitest';

describe('ProjectMapMenuComponent', () => {
  it('should be defined', () => {
    expect(ProjectMapMenuComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ProjectMapMenuComponent.name).toBe('ProjectMapMenuComponent');
  });
});
