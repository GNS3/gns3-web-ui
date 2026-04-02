import { describe, it, expect } from 'vitest';
import { ConfiguratorDialogEthernetSwitchComponent } from './configurator-ethernet-switch.component';

describe('ConfiguratorDialogEthernetSwitchComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getConfiguration method', () => {
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).getConfiguration).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have addTag method', () => {
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).addTag).toBe('function');
    });

    it('should have removeTag method', () => {
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).removeTag).toBe('function');
    });
  });
});
