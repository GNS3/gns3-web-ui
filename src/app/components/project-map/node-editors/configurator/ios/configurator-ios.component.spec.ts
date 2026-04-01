import { ConfiguratorDialogIosComponent } from './configurator-ios.component';
import { describe, it, expect } from 'vitest';

describe('ConfiguratorDialogIosComponent', () => {
  it('should be defined', () => {
    expect(ConfiguratorDialogIosComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfiguratorDialogIosComponent.name).toBe('ConfiguratorDialogIosComponent');
  });
});
