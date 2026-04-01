import { ConfigDialogComponent } from './config-dialog.component';
import { describe, it, expect } from 'vitest';

describe('ConfigDialogComponent', () => {
  it('should be defined', () => {
    expect(ConfigDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfigDialogComponent.name).toBe('ConfigDialogComponent');
  });
});
