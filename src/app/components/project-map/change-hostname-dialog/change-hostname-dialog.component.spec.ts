import { ChangeHostnameDialogComponent } from './change-hostname-dialog.component';
import { describe, it, expect } from 'vitest';

describe('ChangeHostnameDialogComponent', () => {
  it('should be defined', () => {
    expect(ChangeHostnameDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ChangeHostnameDialogComponent.name).toBe('ChangeHostnameDialogComponent');
  });

  // Note: Dialog component requires MatDialogRef and MAT_DIALOG_DATA
});
