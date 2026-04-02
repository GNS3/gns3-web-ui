import { describe, it, expect } from 'vitest';
import { ApplianceInfoDialogComponent } from './appliance-info-dialog.component';

describe('ApplianceInfoDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have onNoClick method', () => {
      expect(typeof (ApplianceInfoDialogComponent.prototype as any).onNoClick).toBe('function');
    });
  });
});
