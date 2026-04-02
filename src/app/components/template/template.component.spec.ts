import { describe, it, expect } from 'vitest';
import { TemplateComponent } from './template.component';

describe('TemplateComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (TemplateComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (TemplateComponent.prototype as any).ngOnDestroy).toBe('function');
    });

    it('should have sortTemplates method', () => {
      expect(typeof (TemplateComponent.prototype as any).sortTemplates).toBe('function');
    });

    it('should have filterTemplates method', () => {
      expect(typeof (TemplateComponent.prototype as any).filterTemplates).toBe('function');
    });

    it('should have dragStart method', () => {
      expect(typeof (TemplateComponent.prototype as any).dragStart).toBe('function');
    });

    it('should have dragEnd method', () => {
      expect(typeof (TemplateComponent.prototype as any).dragEnd).toBe('function');
    });

    it('should have openDialog method', () => {
      expect(typeof (TemplateComponent.prototype as any).openDialog).toBe('function');
    });

    it('should have getImageSourceForTemplate method', () => {
      expect(typeof (TemplateComponent.prototype as any).getImageSourceForTemplate).toBe('function');
    });
  });
});
