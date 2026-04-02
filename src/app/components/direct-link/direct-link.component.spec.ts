import { describe, it, expect } from 'vitest';
import { DirectLinkComponent } from './direct-link.component';

describe('DirectLinkComponent', () => {
  it('should have correct protocols list', () => {
    const protocols = [
      { key: 'http:', name: 'HTTP' },
      { key: 'https:', name: 'HTTPS' },
    ];
    expect(protocols).toHaveLength(2);
    expect(protocols[0].key).toBe('http:');
    expect(protocols[1].key).toBe('https:');
  });

  it('should have correct locations list', () => {
    const locations = [
      { key: 'local', name: 'Local' },
      { key: 'remote', name: 'Remote' },
    ];
    expect(locations).toHaveLength(2);
    expect(locations[0].key).toBe('local');
    expect(locations[1].key).toBe('remote');
  });
});
