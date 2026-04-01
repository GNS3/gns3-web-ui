import { DockerTemplatesComponent } from './docker-templates.component';
import { describe, it, expect } from 'vitest';

describe('DockerTemplatesComponent', () => {
  it('should be defined', () => {
    expect(DockerTemplatesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(DockerTemplatesComponent.name).toBe('DockerTemplatesComponent');
  });
});
