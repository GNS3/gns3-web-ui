import { ChangeSymbolDialogComponent } from './change-symbol-dialog.component';
import { describe, it, expect } from 'vitest';

describe('ChangeSymbolDialogComponent', () => {
  it('should be defined', () => {
    expect(ChangeSymbolDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ChangeSymbolDialogComponent.name).toBe('ChangeSymbolDialogComponent');
  });

  // Note: Dialog component requires MatDialogRef and MAT_DIALOG_DATA
});
