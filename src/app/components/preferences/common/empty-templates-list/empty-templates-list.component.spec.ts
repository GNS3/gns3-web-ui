import { EmptyTemplatesListComponent } from './empty-templates-list.component';
import { describe, it, expect } from 'vitest';

describe('EmptyTemplatesListComponent', () => {
  it('should be defined', () => {
    expect(EmptyTemplatesListComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(EmptyTemplatesListComponent.name).toBe('EmptyTemplatesListComponent');
  });
});
