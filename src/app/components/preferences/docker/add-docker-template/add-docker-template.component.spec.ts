import { AddDockerTemplateComponent } from './add-docker-template.component';
import { describe, it, expect } from 'vitest';

describe('AddDockerTemplateComponent', () => {
  it('should be defined', () => {
    expect(AddDockerTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AddDockerTemplateComponent.name).toBe('AddDockerTemplateComponent');
  });
});
