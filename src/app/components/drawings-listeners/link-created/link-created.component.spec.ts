import { describe, it, expect } from 'vitest';
import { LinkCreatedComponent } from './link-created.component';

describe('LinkCreatedComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (LinkCreatedComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onLinkCreated method', () => {
      expect(typeof (LinkCreatedComponent.prototype as any).onLinkCreated).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (LinkCreatedComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });
});
