import { EditControllerDialogComponent } from './edit-controller-dialog.component';
import { describe, it, expect } from 'vitest';

describe('EditControllerDialogComponent', () => {
  it('should be defined', () => {
    expect(EditControllerDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(EditControllerDialogComponent.name).toBe('EditControllerDialogComponent');
  });

  // Note: Dialog component requires MatDialogRef and MAT_DIALOG_DATA
});
