import { ImportConfigActionComponent } from './import-config-action.component';
import { describe, it, expect } from 'vitest';

describe('ImportConfigActionComponent', () => {
  it('should be defined', () => {
    expect(ImportConfigActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ImportConfigActionComponent.name).toBe('ImportConfigActionComponent');
  });
});
