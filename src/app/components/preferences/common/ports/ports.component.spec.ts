import { PortsComponent } from './ports.component';
import { describe, it, expect } from 'vitest';

describe('PortsComponent', () => {
  it('should be defined', () => {
    expect(PortsComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(PortsComponent.name).toBe('PortsComponent');
  });
});
