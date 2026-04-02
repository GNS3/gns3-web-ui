import { describe, it, expect } from 'vitest';
import { ChangeUserPasswordComponent } from './change-user-password.component';

describe('ChangeUserPasswordComponent', () => {
  describe('prototype methods', () => {
    it('should have onCancel method', () => {
      expect(typeof (ChangeUserPasswordComponent.prototype as any).onCancel).toBe('function');
    });

    it('should have onPasswordSave method', () => {
      expect(typeof (ChangeUserPasswordComponent.prototype as any).onPasswordSave).toBe('function');
    });

    it('should have passwordForm getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(ChangeUserPasswordComponent.prototype, 'passwordForm')?.get).toBe('function');
    });
  });
});
