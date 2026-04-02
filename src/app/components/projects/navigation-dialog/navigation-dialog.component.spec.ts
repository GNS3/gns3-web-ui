import { describe, it, expect } from 'vitest';
import { NavigationDialogComponent } from './navigation-dialog.component';

describe('NavigationDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (NavigationDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (NavigationDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have onYesClick method', () => {
      expect(typeof (NavigationDialogComponent.prototype as any).onYesClick).toBe('function');
    });
  });
});
