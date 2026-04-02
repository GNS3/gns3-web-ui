import { describe, it, expect } from 'vitest';
import { ConfiguratorDialogIosComponent } from './configurator-ios.component';

describe('ConfiguratorDialogIosComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogIosComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getConfiguration method', () => {
      expect(typeof (ConfiguratorDialogIosComponent.prototype as any).getConfiguration).toBe('function');
    });

    it('should have fillSlotsData method', () => {
      expect(typeof (ConfiguratorDialogIosComponent.prototype as any).fillSlotsData).toBe('function');
    });

    it('should have saveSlotsData method', () => {
      expect(typeof (ConfiguratorDialogIosComponent.prototype as any).saveSlotsData).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogIosComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogIosComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have addTag method', () => {
      expect(typeof (ConfiguratorDialogIosComponent.prototype as any).addTag).toBe('function');
    });

    it('should have removeTag method', () => {
      expect(typeof (ConfiguratorDialogIosComponent.prototype as any).removeTag).toBe('function');
    });
  });
});
