import { describe, it, expect } from 'vitest';
import { ModelTypeHelpDialogComponent } from './model-type-help-dialog.component';

describe('ModelTypeHelpDialogComponent', () => {
  it('should create', () => {
    expect(ModelTypeHelpDialogComponent).toBeTruthy();
  });

  it('should have close method', () => {
    expect(typeof (ModelTypeHelpDialogComponent.prototype as any).close).toBe('function');
  });
});
