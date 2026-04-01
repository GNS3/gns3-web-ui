import { ScreenshotDialogComponent } from './screenshot-dialog.component';
import { describe, it, expect } from 'vitest';

describe('ScreenshotDialogComponent', () => {
  it('should be defined', () => {
    expect(ScreenshotDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ScreenshotDialogComponent.name).toBe('ScreenshotDialogComponent');
  });
});
