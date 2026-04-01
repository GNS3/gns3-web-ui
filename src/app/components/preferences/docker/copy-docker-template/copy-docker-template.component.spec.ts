import { CopyDockerTemplateComponent } from './copy-docker-template.component';
import { describe, it, expect } from 'vitest';

describe('CopyDockerTemplateComponent', () => {
  it('should be defined', () => {
    expect(CopyDockerTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(CopyDockerTemplateComponent.name).toBe('CopyDockerTemplateComponent');
  });
});
