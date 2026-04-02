import { describe, it, expect } from 'vitest';
import { GroupDetailDialogComponent } from './group-detail-dialog.component';

describe('GroupDetailDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (GroupDetailDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have loadMembers method', () => {
      expect(typeof (GroupDetailDialogComponent.prototype as any).loadMembers).toBe('function');
    });

    it('should have loadAces method', () => {
      expect(typeof (GroupDetailDialogComponent.prototype as any).loadAces).toBe('function');
    });

    it('should have onUpdate method', () => {
      expect(typeof (GroupDetailDialogComponent.prototype as any).onUpdate).toBe('function');
    });

    it('should have onClose method', () => {
      expect(typeof (GroupDetailDialogComponent.prototype as any).onClose).toBe('function');
    });

    it('should have openAddUserDialog method', () => {
      expect(typeof (GroupDetailDialogComponent.prototype as any).openAddUserDialog).toBe('function');
    });

    it('should have openRemoveUserDialog method', () => {
      expect(typeof (GroupDetailDialogComponent.prototype as any).openRemoveUserDialog).toBe('function');
    });

    it('should have openUserDetailDialog method', () => {
      expect(typeof (GroupDetailDialogComponent.prototype as any).openUserDetailDialog).toBe('function');
    });
  });
});
