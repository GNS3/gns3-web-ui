import { describe, it, expect } from 'vitest';
import { DrawLinkToolComponent } from './draw-link-tool.component';

describe('DrawLinkToolComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (DrawLinkToolComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (DrawLinkToolComponent.prototype as any).ngOnDestroy).toBe('function');
    });

    it('should have onChooseInterface method', () => {
      expect(typeof (DrawLinkToolComponent.prototype as any).onChooseInterface).toBe('function');
    });
  });
});
