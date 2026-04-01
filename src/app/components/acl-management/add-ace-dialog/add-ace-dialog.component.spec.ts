import { AddAceDialogComponent } from './add-ace-dialog.component';
import { describe, it, expect } from 'vitest';

describe('AddAceDialogComponent', () => {
  it('should be defined', () => {
    expect(AddAceDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AddAceDialogComponent.name).toBe('AddAceDialogComponent');
  });

  // Note: Dialog component requires MatDialogRef and MAT_DIALOG_DATA
});
