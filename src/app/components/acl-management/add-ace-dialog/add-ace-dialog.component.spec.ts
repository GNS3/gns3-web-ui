import { describe, it, expect } from 'vitest';
import { AddAceDialogComponent } from './add-ace-dialog.component';

describe('AddAceDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any).onAddClick).toBe('function');
    });

    it('should have changeAllowed method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any).changeAllowed).toBe('function');
    });

    it('should have displayFn method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any).displayFn).toBe('function');
    });

    it('should have displayFnUser method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any).displayFnUser).toBe('function');
    });

    it('should have _filter method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any)._filter).toBe('function');
    });

    it('should have _filterUser method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any)._filterUser).toBe('function');
    });

    it('should have _filterRole method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any)._filterRole).toBe('function');
    });

    it('should have userSelection method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any).userSelection).toBe('function');
    });

    it('should have groupSelection method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any).groupSelection).toBe('function');
    });

    it('should have roleSelection method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any).roleSelection).toBe('function');
    });

    it('should have endpointSelection method', () => {
      expect(typeof (AddAceDialogComponent.prototype as any).endpointSelection).toBe('function');
    });

    it('should have form getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(AddAceDialogComponent.prototype, 'form')?.get).toBe('function');
    });
  });
});
