import { ToolDetailsDialogComponent } from './tool-details-dialog.component';
import { describe, it, expect } from 'vitest';

describe('ToolDetailsDialogComponent', () => {
  it('should be defined', () => {
    expect(ToolDetailsDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ToolDetailsDialogComponent.name).toBe('ToolDetailsDialogComponent');
  });
});
