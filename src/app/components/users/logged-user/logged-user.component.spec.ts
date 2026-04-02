import { describe, it, expect } from 'vitest';
import { LoggedUserComponent } from './logged-user.component';

describe('LoggedUserComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (LoggedUserComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have changePassword method', () => {
      expect(typeof (LoggedUserComponent.prototype as any).changePassword).toBe('function');
    });

    it('should have copyToken method', () => {
      expect(typeof (LoggedUserComponent.prototype as any).copyToken).toBe('function');
    });
  });
});
