import { NewTemplateDialogComponent } from './new-template-dialog.component';
import { describe, it, expect } from 'vitest';

describe('NewTemplateDialogComponent', () => {
  it('should be defined', () => {
    expect(NewTemplateDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(NewTemplateDialogComponent.name).toBe('NewTemplateDialogComponent');
  });

  // Note: Dialog component requires MatDialogRef and dependencies
});
