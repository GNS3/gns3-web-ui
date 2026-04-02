import { describe, it, expect } from 'vitest';
import { GlobalUploadIndicatorComponent } from './global-upload-indicator.component';

describe('GlobalUploadIndicatorComponent', () => {
  describe('prototype methods', () => {
    it('should have cancelUpload method', () => {
      expect(typeof (GlobalUploadIndicatorComponent.prototype as any).cancelUpload).toBe('function');
    });

    it('should have navigateToFile method', () => {
      expect(typeof (GlobalUploadIndicatorComponent.prototype as any).navigateToFile).toBe('function');
    });

    it('should have toggleExpanded method', () => {
      expect(typeof (GlobalUploadIndicatorComponent.prototype as any).toggleExpanded).toBe('function');
    });

    it('should have trackByTempId method', () => {
      expect(typeof (GlobalUploadIndicatorComponent.prototype as any).trackByTempId).toBe('function');
    });

    it('should have uploadList getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(GlobalUploadIndicatorComponent.prototype, 'uploadList')?.get).toBe('function');
    });

    it('should have hasUploads getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(GlobalUploadIndicatorComponent.prototype, 'hasUploads')?.get).toBe('function');
    });

    it('should have activeCount getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(GlobalUploadIndicatorComponent.prototype, 'activeCount')?.get).toBe('function');
    });

    it('should have overallProgress getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(GlobalUploadIndicatorComponent.prototype, 'overallProgress')?.get).toBe('function');
    });

    it('should have ngOnInit method', () => {
      expect(typeof (GlobalUploadIndicatorComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (GlobalUploadIndicatorComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });

  describe('trackByTempId', () => {
    it('should return tempId as track key', () => {
      const component = {
        trackByTempId: GlobalUploadIndicatorComponent.prototype.trackByTempId,
      };
      expect(component.trackByTempId(0, { tempId: 'test-123' } as any)).toBe('test-123');
    });
  });
});
