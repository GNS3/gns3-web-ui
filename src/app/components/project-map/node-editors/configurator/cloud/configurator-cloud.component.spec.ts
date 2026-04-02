import { describe, it, expect } from 'vitest';
import { ConfiguratorDialogCloudComponent } from './configurator-cloud.component';

describe('ConfiguratorDialogCloudComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogCloudComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getConfiguration method', () => {
      expect(typeof (ConfiguratorDialogCloudComponent.prototype as any).getConfiguration).toBe('function');
    });

    it('should have onAddEthernetInterface method', () => {
      expect(typeof (ConfiguratorDialogCloudComponent.prototype as any).onAddEthernetInterface).toBe('function');
    });

    it('should have onAddTapInterface method', () => {
      expect(typeof (ConfiguratorDialogCloudComponent.prototype as any).onAddTapInterface).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogCloudComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogCloudComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have addTag method', () => {
      expect(typeof (ConfiguratorDialogCloudComponent.prototype as any).addTag).toBe('function');
    });

    it('should have removeTag method', () => {
      expect(typeof (ConfiguratorDialogCloudComponent.prototype as any).removeTag).toBe('function');
    });
  });
});
