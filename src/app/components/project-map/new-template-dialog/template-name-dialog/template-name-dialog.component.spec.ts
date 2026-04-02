import { describe, it, expect } from 'vitest';
import { TemplateNameDialogComponent } from './template-name-dialog.component';

describe('TemplateNameDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (TemplateNameDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (TemplateNameDialogComponent.prototype as any).onAddClick).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (TemplateNameDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have onKeyDown method', () => {
      expect(typeof (TemplateNameDialogComponent.prototype as any).onKeyDown).toBe('function');
    });
  });
});
