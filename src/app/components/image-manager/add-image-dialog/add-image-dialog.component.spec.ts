import { describe, it, expect } from 'vitest';
import { AddImageDialogComponent } from './add-image-dialog.component';

describe('AddImageDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (AddImageDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onFilesSelected method', () => {
      expect(typeof (AddImageDialogComponent.prototype as any).onFilesSelected).toBe('function');
    });

    it('should have selectInstallApplianceOption method', () => {
      expect(typeof (AddImageDialogComponent.prototype as any).selectInstallApplianceOption).toBe('function');
    });

    it('should have closeDialog method', () => {
      expect(typeof (AddImageDialogComponent.prototype as any).closeDialog).toBe('function');
    });
  });
});
