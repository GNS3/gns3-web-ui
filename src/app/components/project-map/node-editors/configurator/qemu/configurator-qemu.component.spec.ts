import { describe, it, expect } from 'vitest';
import { ConfiguratorDialogQemuComponent } from './configurator-qemu.component';

describe('ConfiguratorDialogQemuComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have openQemuImageCreator method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).openQemuImageCreator).toBe('function');
    });

    it('should have uploadCdromImageFile method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).uploadCdromImageFile).toBe('function');
    });

    it('should have uploadInitrdFile method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).uploadInitrdFile).toBe('function');
    });

    it('should have uploadKernelImageFile method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).uploadKernelImageFile).toBe('function');
    });

    it('should have uploadBiosFile method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).uploadBiosFile).toBe('function');
    });

    it('should have getConfiguration method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).getConfiguration).toBe('function');
    });

    it('should have filterImages method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).filterImages).toBe('function');
    });

    it('should have onHdaImageInput method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).onHdaImageInput).toBe('function');
    });

    it('should have onHdbImageInput method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).onHdbImageInput).toBe('function');
    });

    it('should have onHdcImageInput method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).onHdcImageInput).toBe('function');
    });

    it('should have onHddImageInput method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).onHddImageInput).toBe('function');
    });

    it('should have openCustomAdaptersDialog method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).openCustomAdaptersDialog).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have addTag method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).addTag).toBe('function');
    });

    it('should have removeTag method', () => {
      expect(typeof (ConfiguratorDialogQemuComponent.prototype as any).removeTag).toBe('function');
    });
  });
});
