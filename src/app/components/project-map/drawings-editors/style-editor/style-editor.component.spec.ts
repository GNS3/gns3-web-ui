import { StyleEditorDialogComponent } from './style-editor.component';
import { describe, it, expect } from 'vitest';

describe('StyleEditorDialogComponent', () => {
  it('should be defined', () => {
    expect(StyleEditorDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(StyleEditorDialogComponent.name).toBe('StyleEditorDialogComponent');
  });
});
