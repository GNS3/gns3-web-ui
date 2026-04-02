import { describe, it, expect } from 'vitest';
import { LockActionComponent, LockConfirmDialogComponent } from './lock-action.component';

describe('LockActionComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnChanges method', () => {
      expect(typeof (LockActionComponent.prototype as any).ngOnChanges).toBe('function');
    });

    it('should have lock method', () => {
      expect(typeof (LockActionComponent.prototype as any).lock).toBe('function');
    });

    it('should have performLockUnlock method', () => {
      expect(typeof (LockActionComponent.prototype as any).performLockUnlock).toBe('function');
    });
  });
});

describe('LockConfirmDialogComponent', () => {
  describe('exported components', () => {
    it('should export LockConfirmDialogComponent', () => {
      expect(LockConfirmDialogComponent).toBeDefined();
    });
  });
});
