import { describe, it, expect } from 'vitest';
import { SnapshotDialogComponent } from './snapshot-dialog.component';

describe('SnapshotDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have openCreateDialog method', () => {
      expect(typeof (SnapshotDialogComponent.prototype as any).openCreateDialog).toBe('function');
    });

    it('should have restoreSnapshot method', () => {
      expect(typeof (SnapshotDialogComponent.prototype as any).restoreSnapshot).toBe('function');
    });

    it('should have deleteSnapshot method', () => {
      expect(typeof (SnapshotDialogComponent.prototype as any).deleteSnapshot).toBe('function');
    });
  });
});
