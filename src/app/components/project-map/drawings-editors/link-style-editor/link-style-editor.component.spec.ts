import { LinkStyleEditorDialogComponent } from './link-style-editor.component';
import { describe, it, expect } from 'vitest';

describe('LinkStyleEditorDialogComponent', () => {
  it('should be defined', () => {
    expect(LinkStyleEditorDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(LinkStyleEditorDialogComponent.name).toBe('LinkStyleEditorDialogComponent');
  });
});
