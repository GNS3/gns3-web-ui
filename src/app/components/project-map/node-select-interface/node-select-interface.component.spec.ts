import { describe, it, expect } from 'vitest';
import { NodeSelectInterfaceComponent } from './node-select-interface.component';

describe('NodeSelectInterfaceComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (NodeSelectInterfaceComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have setPosition method', () => {
      expect(typeof (NodeSelectInterfaceComponent.prototype as any).setPosition).toBe('function');
    });

    it('should have open method', () => {
      expect(typeof (NodeSelectInterfaceComponent.prototype as any).open).toBe('function');
    });

    it('should have filterNodePorts method', () => {
      expect(typeof (NodeSelectInterfaceComponent.prototype as any).filterNodePorts).toBe('function');
    });

    it('should have chooseInterface method', () => {
      expect(typeof (NodeSelectInterfaceComponent.prototype as any).chooseInterface).toBe('function');
    });
  });
});
