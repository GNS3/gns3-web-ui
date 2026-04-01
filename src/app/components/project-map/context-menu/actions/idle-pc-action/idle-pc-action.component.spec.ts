import { IdlePcActionComponent } from './idle-pc-action.component';
import { describe, it, expect } from 'vitest';

describe('IdlePcActionComponent', () => {
  it('should be defined', () => {
    expect(IdlePcActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(IdlePcActionComponent.name).toBe('IdlePcActionComponent');
  });
});
