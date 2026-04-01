import { AddGroupDialogComponent } from './add-group-dialog.component';
import { describe, it, expect } from 'vitest';

describe('AddGroupDialogComponent', () => {
  it('should be defined', () => {
    expect(AddGroupDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AddGroupDialogComponent.name).toBe('AddGroupDialogComponent');
  });

  // Note: Dialog component requires MatDialogRef and MAT_DIALOG_DATA
});
