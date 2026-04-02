import { describe, it, expect } from 'vitest';
import { AddUserToGroupDialogComponent } from './add-user-to-group-dialog.component';

describe('AddUserToGroupDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have onSearch method', () => {
      expect(typeof (AddUserToGroupDialogComponent.prototype as any).onSearch).toBe('function');
    });

    it('should have getUsers method', () => {
      expect(typeof (AddUserToGroupDialogComponent.prototype as any).getUsers).toBe('function');
    });

    it('should have addUser method', () => {
      expect(typeof (AddUserToGroupDialogComponent.prototype as any).addUser).toBe('function');
    });

    it('should have toggleUserSelection method', () => {
      expect(typeof (AddUserToGroupDialogComponent.prototype as any).toggleUserSelection).toBe('function');
    });

    it('should have isUserSelected method', () => {
      expect(typeof (AddUserToGroupDialogComponent.prototype as any).isUserSelected).toBe('function');
    });

    it('should have toggleSelectAll method', () => {
      expect(typeof (AddUserToGroupDialogComponent.prototype as any).toggleSelectAll).toBe('function');
    });

    it('should have addSelectedUsers method', () => {
      expect(typeof (AddUserToGroupDialogComponent.prototype as any).addSelectedUsers).toBe('function');
    });

    it('should have onClose method', () => {
      expect(typeof (AddUserToGroupDialogComponent.prototype as any).onClose).toBe('function');
    });

    it('should have ngOnInit method', () => {
      expect(typeof (AddUserToGroupDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have removeUserFromList private method', () => {
      expect(typeof (AddUserToGroupDialogComponent.prototype as any).removeUserFromList).toBe('function');
    });
  });
});
