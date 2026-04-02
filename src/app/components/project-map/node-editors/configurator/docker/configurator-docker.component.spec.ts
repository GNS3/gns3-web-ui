import { describe, it, expect } from 'vitest';
import { ConfiguratorDialogDockerComponent } from './configurator-docker.component';

describe('ConfiguratorDialogDockerComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogDockerComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getConfiguration method', () => {
      expect(typeof (ConfiguratorDialogDockerComponent.prototype as any).getConfiguration).toBe('function');
    });

    it('should have configureCustomAdapters method', () => {
      expect(typeof (ConfiguratorDialogDockerComponent.prototype as any).configureCustomAdapters).toBe('function');
    });

    it('should have editNetworkConfiguration method', () => {
      expect(typeof (ConfiguratorDialogDockerComponent.prototype as any).editNetworkConfiguration).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogDockerComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogDockerComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have addTag method', () => {
      expect(typeof (ConfiguratorDialogDockerComponent.prototype as any).addTag).toBe('function');
    });

    it('should have removeTag method', () => {
      expect(typeof (ConfiguratorDialogDockerComponent.prototype as any).removeTag).toBe('function');
    });
  });
});
