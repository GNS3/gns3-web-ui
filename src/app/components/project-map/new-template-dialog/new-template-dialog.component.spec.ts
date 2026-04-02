import { describe, it, expect } from 'vitest';
import { NewTemplateDialogComponent } from './new-template-dialog.component';

describe('NewTemplateDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have updateAppliances method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).updateAppliances).toBe('function');
    });

    it('should have refreshImages method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).refreshImages).toBe('function');
    });

    it('should have getAppliance method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).getAppliance).toBe('function');
    });

    it('should have addAppliance method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).addAppliance).toBe('function');
    });

    it('should have filterAppliances method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).filterAppliances).toBe('function');
    });

    it('should have setAction method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).setAction).toBe('function');
    });

    it('should have setControllerType method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).setControllerType).toBe('function');
    });

    it('should have sortData method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).sortData).toBe('function');
    });

    it('should have onCloseClick method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).onCloseClick).toBe('function');
    });

    it('should have install method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).install).toBe('function');
    });

    it('should have showInfo method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).showInfo).toBe('function');
    });

    it('should have importImage method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).importImage).toBe('function');
    });

    it('should have importImageFile method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).importImageFile).toBe('function');
    });

    it('should have cancelUploading method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).cancelUploading).toBe('function');
    });

    it('should have checkImageFromVersion method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).checkImageFromVersion).toBe('function');
    });

    it('should have openConfirmationDialog method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).openConfirmationDialog).toBe('function');
    });

    it('should have downloadImage method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).downloadImage).toBe('function');
    });

    it('should have downloadImageFromVersion method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).downloadImageFromVersion).toBe('function');
    });

    it('should have getCategory method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).getCategory).toBe('function');
    });

    it('should have createIouTemplate method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).createIouTemplate).toBe('function');
    });

    it('should have createIosTemplate method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).createIosTemplate).toBe('function');
    });

    it('should have createDockerTemplate method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).createDockerTemplate).toBe('function');
    });

    it('should have findControllerImageName method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).findControllerImageName).toBe('function');
    });

    it('should have createQemuTemplateFromVersion method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).createQemuTemplateFromVersion).toBe('function');
    });

    it('should have openSnackBar method', () => {
      expect(typeof (NewTemplateDialogComponent.prototype as any).openSnackBar).toBe('function');
    });
  });
});
