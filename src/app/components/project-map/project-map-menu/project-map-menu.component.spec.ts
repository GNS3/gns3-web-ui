import { describe, it, expect } from 'vitest';
import { ProjectMapMenuComponent } from './project-map-menu.component';

describe('ProjectMapMenuComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).ngOnDestroy).toBe('function');
    });

    it('should have getCssClassForIcon method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).getCssClassForIcon).toBe('function');
    });

    it('should have takeScreenshot method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).takeScreenshot).toBe('function');
    });

    it('should have addDrawing method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).addDrawing).toBe('function');
    });

    it('should have onDrawingSaved method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).onDrawingSaved).toBe('function');
    });

    it('should have resetDrawToolChoice method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).resetDrawToolChoice).toBe('function');
    });

    it('should have getAllNodesAndDrawingStatus method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).getAllNodesAndDrawingStatus).toBe('function');
    });

    it('should have changeLockValue method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).changeLockValue).toBe('function');
    });

    it('should have lockAllNode method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).lockAllNode).toBe('function');
    });

    it('should have unlockAllNode method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).unlockAllNode).toBe('function');
    });

    it('should have uploadImageFile method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).uploadImageFile).toBe('function');
    });

    it('should have openAIChat method', () => {
      expect(typeof (ProjectMapMenuComponent.prototype as any).openAIChat).toBe('function');
    });
  });
});
