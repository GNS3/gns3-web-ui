import { describe, it, expect } from 'vitest';
import { UserDetailDialogComponent, UserDetailDialogData } from './user-detail-dialog.component';

describe('UserDetailDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (UserDetailDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have initForm method', () => {
      expect(typeof (UserDetailDialogComponent.prototype as any).initForm).toBe('function');
    });

    it('should have loadGroupsData method', () => {
      expect(typeof (UserDetailDialogComponent.prototype as any).loadGroupsData).toBe('function');
    });

    it('should have loadAceData method', () => {
      expect(typeof (UserDetailDialogComponent.prototype as any).loadAceData).toBe('function');
    });

    it('should have onSaveChanges method', () => {
      expect(typeof (UserDetailDialogComponent.prototype as any).onSaveChanges).toBe('function');
    });

    it('should have getUpdatedValues method', () => {
      expect(typeof (UserDetailDialogComponent.prototype as any).getUpdatedValues).toBe('function');
    });

    it('should have onChangePassword method', () => {
      expect(typeof (UserDetailDialogComponent.prototype as any).onChangePassword).toBe('function');
    });

    it('should have onCancel method', () => {
      expect(typeof (UserDetailDialogComponent.prototype as any).onCancel).toBe('function');
    });

    it('should have form getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(UserDetailDialogComponent.prototype, 'form')?.get).toBe('function');
    });
  });

  describe('exported types', () => {
    it('should export UserDetailDialogData interface', () => {
      const data: UserDetailDialogData = {
        user: {} as any,
        controller: {} as any,
      };
      expect(data.user).toBeDefined();
      expect(data.controller).toBeDefined();
    });
  });
});
