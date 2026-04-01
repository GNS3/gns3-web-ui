import { ProjectReadmeComponent } from './project-readme.component';
import { describe, it, expect } from 'vitest';

describe('ProjectReadmeComponent', () => {
  it('should be defined', () => {
    expect(ProjectReadmeComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ProjectReadmeComponent.name).toBe('ProjectReadmeComponent');
  });
});
