import { LinkCreatedComponent } from './link-created.component';
import { describe, it, expect } from 'vitest';

describe('LinkCreatedComponent', () => {
  it('should be defined', () => {
    expect(LinkCreatedComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(LinkCreatedComponent.name).toBe('LinkCreatedComponent');
  });
});
