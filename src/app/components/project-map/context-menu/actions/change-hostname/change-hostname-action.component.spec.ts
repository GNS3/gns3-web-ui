import { ChangeHostnameActionComponent } from './change-hostname-action.component';
import { describe, it, expect } from 'vitest';

describe('ChangeHostnameActionComponent', () => {
  it('should be defined', () => {
    expect(ChangeHostnameActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ChangeHostnameActionComponent.name).toBe('ChangeHostnameActionComponent');
  });
});
