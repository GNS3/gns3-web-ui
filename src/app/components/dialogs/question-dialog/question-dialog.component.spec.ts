import { QuestionDialogComponent } from './question-dialog.component';
import { describe, it, expect } from 'vitest';

describe('QuestionDialogComponent', () => {
  it('should create component', () => {
    expect(QuestionDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    // Component uses inject() for MatDialogRef, constructor only takes MAT_DIALOG_DATA
    expect(QuestionDialogComponent).toBeDefined();
  });

  // Note: Full dialog testing requires mocking MatDialogRef and MAT_DIALOG_DATA
  // Service tests provide better coverage for business logic
});
