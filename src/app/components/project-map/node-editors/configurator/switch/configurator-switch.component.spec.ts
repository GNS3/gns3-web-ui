import { describe, it, expect } from 'vitest';
import { ConfiguratorDialogSwitchComponent, NodeMapping } from './configurator-switch.component';

describe('ConfiguratorDialogSwitchComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogSwitchComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof (ConfiguratorDialogSwitchComponent.prototype as any).delete).toBe('function');
    });

    it('should have add method', () => {
      expect(typeof (ConfiguratorDialogSwitchComponent.prototype as any).add).toBe('function');
    });

    it('should have clearUserInput method', () => {
      expect(typeof (ConfiguratorDialogSwitchComponent.prototype as any).clearUserInput).toBe('function');
    });

    it('should have strMapToObj method', () => {
      expect(typeof (ConfiguratorDialogSwitchComponent.prototype as any).strMapToObj).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogSwitchComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogSwitchComponent.prototype as any).onCancelClick).toBe('function');
    });
  });

  describe('exported types', () => {
    it('should export NodeMapping interface', () => {
      const nodeMapping: NodeMapping = { portIn: '0:1', portOut: '1:1' };
      expect(nodeMapping.portIn).toBe('0:1');
    });
  });
});
