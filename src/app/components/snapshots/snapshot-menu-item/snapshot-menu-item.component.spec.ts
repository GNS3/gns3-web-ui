import { describe, it, expect } from 'vitest';
import { SnapshotMenuItemComponent } from './snapshot-menu-item.component';

describe('SnapshotMenuItemComponent', () => {
  describe('prototype methods', () => {
    it('should have openSnapshotDialog method', () => {
      expect(typeof (SnapshotMenuItemComponent.prototype as any).openSnapshotDialog).toBe('function');
    });
  });
});
