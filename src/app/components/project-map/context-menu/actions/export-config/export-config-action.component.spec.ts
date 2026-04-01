import { ExportConfigActionComponent } from './export-config-action.component';
import { describe, it, expect } from 'vitest';

describe('ExportConfigActionComponent', () => {
  it('should be defined', () => {
    expect(ExportConfigActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ExportConfigActionComponent.name).toBe('ExportConfigActionComponent');
  });
});
