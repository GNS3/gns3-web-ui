import { describe, it, expect } from 'vitest';
import { EditLinkStyleActionComponent } from './edit-link-style-action.component';

describe('EditLinkStyleActionComponent', () => {
  describe('prototype methods', () => {
    it('should have editStyle method', () => {
      expect(typeof (EditLinkStyleActionComponent.prototype as any).editStyle).toBe('function');
    });
  });
});
