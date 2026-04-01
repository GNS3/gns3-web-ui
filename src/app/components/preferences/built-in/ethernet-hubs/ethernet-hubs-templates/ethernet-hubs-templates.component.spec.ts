import { EthernetHubsTemplatesComponent } from './ethernet-hubs-templates.component';
import { describe, it, expect } from 'vitest';

describe('EthernetHubsTemplatesComponent', () => {
  it('should be defined', () => {
    expect(EthernetHubsTemplatesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(EthernetHubsTemplatesComponent.name).toBe('EthernetHubsTemplatesComponent');
  });
});
