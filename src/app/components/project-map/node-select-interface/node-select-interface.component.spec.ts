import { NodeSelectInterfaceComponent } from './node-select-interface.component';
import { describe, it, expect } from 'vitest';

describe('NodeSelectInterfaceComponent', () => {
  it('should be defined', () => {
    expect(NodeSelectInterfaceComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(NodeSelectInterfaceComponent.name).toBe('NodeSelectInterfaceComponent');
  });
});
