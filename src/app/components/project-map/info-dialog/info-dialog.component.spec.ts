import { InfoDialogComponent } from './info-dialog.component';
import { describe, it, expect } from 'vitest';

describe('InfoDialogComponent', () => {
  it('should be defined', () => {
    expect(InfoDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(InfoDialogComponent.name).toBe('InfoDialogComponent');
  });

  // Note: Dialog component requires MatDialogRef and MAT_DIALOG_DATA
});
