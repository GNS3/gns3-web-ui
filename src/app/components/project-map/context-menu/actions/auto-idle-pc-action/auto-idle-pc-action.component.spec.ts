import { AutoIdlePcActionComponent } from './auto-idle-pc-action.component';
import { describe, it, expect } from 'vitest';

describe('AutoIdlePcActionComponent', () => {
  it('should be defined', () => {
    expect(AutoIdlePcActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AutoIdlePcActionComponent.name).toBe('AutoIdlePcActionComponent');
  });
});
