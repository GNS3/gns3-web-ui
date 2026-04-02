import { describe, it, expect } from 'vitest';
import { ChooseNameDialogComponent } from './choose-name-dialog.component';

describe('ChooseNameDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ChooseNameDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onCloseClick method', () => {
      expect(typeof (ChooseNameDialogComponent.prototype as any).onCloseClick).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ChooseNameDialogComponent.prototype as any).onSaveClick).toBe('function');
    });
  });
});
