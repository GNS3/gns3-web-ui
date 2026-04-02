import { describe, it, expect } from 'vitest';
import { InstallSoftwareComponent } from './install-software.component';

describe('InstallSoftwareComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (InstallSoftwareComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnChanges method', () => {
      expect(typeof (InstallSoftwareComponent.prototype as any).ngOnChanges).toBe('function');
    });

    it('should have install method', () => {
      expect(typeof (InstallSoftwareComponent.prototype as any).install).toBe('function');
    });
  });
});
