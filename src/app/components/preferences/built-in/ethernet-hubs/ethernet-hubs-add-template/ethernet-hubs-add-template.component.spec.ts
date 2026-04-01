import { EthernetHubsAddTemplateComponent } from './ethernet-hubs-add-template.component';
import { describe, it, expect } from 'vitest';

describe('EthernetHubsAddTemplateComponent', () => {
  it('should be defined', () => {
    expect(EthernetHubsAddTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(EthernetHubsAddTemplateComponent.name).toBe('EthernetHubsAddTemplateComponent');
  });
});
