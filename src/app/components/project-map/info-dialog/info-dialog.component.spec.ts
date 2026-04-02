import { describe, it, expect } from 'vitest';
import { InfoDialogComponent } from './info-dialog.component';

describe('InfoDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (InfoDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onCloseClick method', () => {
      expect(typeof (InfoDialogComponent.prototype as any).onCloseClick).toBe('function');
    });
  });
});
