import { UdpTunnelsComponent } from './udp-tunnels.component';
import { describe, it, expect } from 'vitest';

describe('UdpTunnelsComponent', () => {
  it('should be defined', () => {
    expect(UdpTunnelsComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(UdpTunnelsComponent.name).toBe('UdpTunnelsComponent');
  });
});
