import { TextEditorDialogComponent } from './text-editor.component';
import { describe, it, expect } from 'vitest';

describe('TextEditorDialogComponent', () => {
  it('should be defined', () => {
    expect(TextEditorDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(TextEditorDialogComponent.name).toBe('TextEditorDialogComponent');
  });
});
