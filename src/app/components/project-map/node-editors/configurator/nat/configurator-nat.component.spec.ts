import { describe, it, expect } from 'vitest';
import { ConfiguratorDialogNatComponent } from './configurator-nat.component';

describe('ConfiguratorDialogNatComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogNatComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogNatComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogNatComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have addTag method', () => {
      expect(typeof (ConfiguratorDialogNatComponent.prototype as any).addTag).toBe('function');
    });

    it('should have removeTag method', () => {
      expect(typeof (ConfiguratorDialogNatComponent.prototype as any).removeTag).toBe('function');
    });
  });
});
