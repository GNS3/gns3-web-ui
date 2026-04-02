import { describe, it, expect } from 'vitest';
import { NodesMenuComponent } from './nodes-menu.component';

describe('NodesMenuComponent', () => {
  describe('prototype methods', () => {
    it('should have startConsoleForAllNodes method', () => {
      expect(typeof (NodesMenuComponent.prototype as any).startConsoleForAllNodes).toBe('function');
    });

    it('should have startNodes method', () => {
      expect(typeof (NodesMenuComponent.prototype as any).startNodes).toBe('function');
    });

    it('should have stopNodes method', () => {
      expect(typeof (NodesMenuComponent.prototype as any).stopNodes).toBe('function');
    });

    it('should have suspendNodes method', () => {
      expect(typeof (NodesMenuComponent.prototype as any).suspendNodes).toBe('function');
    });

    it('should have reloadNodes method', () => {
      expect(typeof (NodesMenuComponent.prototype as any).reloadNodes).toBe('function');
    });

    it('should have resetNodes method', () => {
      expect(typeof (NodesMenuComponent.prototype as any).resetNodes).toBe('function');
    });

    it('should have confirmControlsActions method', () => {
      expect(typeof (NodesMenuComponent.prototype as any).confirmControlsActions).toBe('function');
    });
  });
});
