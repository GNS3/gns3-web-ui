import { describe, it, expect } from 'vitest';
import { ConfiguratorDialogEthernetHubComponent } from './configurator-ethernet-hub.component';

describe('ConfiguratorDialogEthernetHubComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogEthernetHubComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getConfiguration method', () => {
      expect(typeof (ConfiguratorDialogEthernetHubComponent.prototype as any).getConfiguration).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogEthernetHubComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogEthernetHubComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have addTag method', () => {
      expect(typeof (ConfiguratorDialogEthernetHubComponent.prototype as any).addTag).toBe('function');
    });

    it('should have removeTag method', () => {
      expect(typeof (ConfiguratorDialogEthernetHubComponent.prototype as any).removeTag).toBe('function');
    });
  });
});
