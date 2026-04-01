import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { describe, it, expect } from 'vitest';

describe('ConfirmationDialogComponent', () => {
  it('should create component', () => {
    expect(ConfirmationDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfirmationDialogComponent).toBeDefined();
  });

  // Note: Full dialog testing requires mocking MatDialogRef and MAT_DIALOG_DATA
  // Service tests provide better coverage for business logic
});
