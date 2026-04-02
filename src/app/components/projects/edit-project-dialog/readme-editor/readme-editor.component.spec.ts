import { describe, it, expect } from 'vitest';
import { ReadmeEditorComponent } from './readme-editor.component';

describe('ReadmeEditorComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ReadmeEditorComponent.prototype as any).ngOnInit).toBe('function');
    });
  });
});
