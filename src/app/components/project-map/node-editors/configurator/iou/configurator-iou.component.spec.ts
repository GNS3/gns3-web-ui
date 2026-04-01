import { ConfiguratorDialogIouComponent } from './configurator-iou.component';
import { describe, it, expect } from 'vitest';

describe('ConfiguratorDialogIouComponent', () => {
  it('should be defined', () => {
    expect(ConfiguratorDialogIouComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfiguratorDialogIouComponent.name).toBe('ConfiguratorDialogIouComponent');
  });
});
