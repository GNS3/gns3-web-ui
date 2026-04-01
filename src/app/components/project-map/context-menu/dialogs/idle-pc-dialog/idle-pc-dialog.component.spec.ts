import { IdlePCDialogComponent } from './idle-pc-dialog.component';
import { describe, it, expect } from 'vitest';

describe('IdlePCDialogComponent', () => {
  it('should be defined', () => {
    expect(IdlePCDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(IdlePCDialogComponent.name).toBe('IdlePCDialogComponent');
  });
});
