import { ProjectsComponent } from './projects.component';
import { describe, it, expect } from 'vitest';

describe('ProjectsComponent', () => {
  it('should be defined', () => {
    expect(ProjectsComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ProjectsComponent.name).toBe('ProjectsComponent');
  });
});
