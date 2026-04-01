import { ConfigEditorDialogComponent } from './config-editor.component';
import { describe, it, expect } from 'vitest';

describe('ConfigEditorDialogComponent', () => {
  it('should be defined', () => {
    expect(ConfigEditorDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfigEditorDialogComponent.name).toBe('ConfigEditorDialogComponent');
  });
});
