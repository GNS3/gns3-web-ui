import { EthernetSwitchesTemplatesComponent } from './ethernet-switches-templates.component';
import { describe, it, expect } from 'vitest';

describe('EthernetSwitchesTemplatesComponent', () => {
  it('should be defined', () => {
    expect(EthernetSwitchesTemplatesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(EthernetSwitchesTemplatesComponent.name).toBe('EthernetSwitchesTemplatesComponent');
  });
});
