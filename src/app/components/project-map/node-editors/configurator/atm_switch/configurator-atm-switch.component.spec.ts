import { describe, it, expect } from 'vitest';
import { ConfiguratorDialogAtmSwitchComponent, NodeMapping } from './configurator-atm-switch.component';

describe('ConfiguratorDialogAtmSwitchComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).delete).toBe('function');
    });

    it('should have add method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).add).toBe('function');
    });

    it('should have clearUserInput method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).clearUserInput).toBe('function');
    });

    it('should have strMapToObj method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).strMapToObj).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).onCancelClick).toBe('function');
    });
  });

  describe('exported types', () => {
    it('should export NodeMapping interface', () => {
      const nodeMapping: NodeMapping = { portIn: '0:0:0', portOut: '1:0:0' };
      expect(nodeMapping.portIn).toBe('0:0:0');
    });
  });
});
