import { EthernetSwitchesAddTemplateComponent } from './ethernet-switches-add-template.component';
import { describe, it, expect } from 'vitest';

describe('EthernetSwitchesAddTemplateComponent', () => {
  it('should be defined', () => {
    expect(EthernetSwitchesAddTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(EthernetSwitchesAddTemplateComponent.name).toBe('EthernetSwitchesAddTemplateComponent');
  });
});
