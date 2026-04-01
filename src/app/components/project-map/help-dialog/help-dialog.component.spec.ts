import { HelpDialogComponent } from './help-dialog.component';
import { describe, it, expect } from 'vitest';

describe('HelpDialogComponent', () => {
  it('should be defined', () => {
    expect(HelpDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(HelpDialogComponent.name).toBe('HelpDialogComponent');
  });

  // Note: Dialog component requires MatDialogRef
});
