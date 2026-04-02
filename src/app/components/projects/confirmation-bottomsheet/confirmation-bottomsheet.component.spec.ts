import { describe, it, expect } from 'vitest';
import { ConfirmationBottomSheetComponent } from './confirmation-bottomsheet.component';

describe('ConfirmationBottomSheetComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfirmationBottomSheetComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (ConfirmationBottomSheetComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have onYesClick method', () => {
      expect(typeof (ConfirmationBottomSheetComponent.prototype as any).onYesClick).toBe('function');
    });
  });
});
