import { AddImageDialogComponent } from './add-image-dialog.component';
import { describe, it, expect } from 'vitest';

describe('AddImageDialogComponent', () => {
  it('should be defined', () => {
    expect(AddImageDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AddImageDialogComponent.name).toBe('AddImageDialogComponent');
  });

  // Note: Dialog component requires MatDialogRef and MAT_DIALOG_DATA
});
