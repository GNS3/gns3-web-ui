import { ProjectMapComponent } from './project-map.component';
import { describe, it, expect } from 'vitest';

describe('ProjectMapComponent', () => {
  it('should be defined', () => {
    expect(ProjectMapComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ProjectMapComponent.name).toBe('ProjectMapComponent');
  });
});
