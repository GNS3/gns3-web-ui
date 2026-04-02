import { describe, it, expect } from 'vitest';
import { CreateSnapshotDialogComponent } from './create-snapshot-dialog.component';

describe('CreateSnapshotDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have onAddClick method', () => {
      expect(typeof (CreateSnapshotDialogComponent.prototype as any).onAddClick).toBe('function');
    });
  });
});
