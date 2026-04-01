import { ExportPortableProjectComponent } from './export-portable-project.component';
import { describe, it, expect } from 'vitest';

describe('ExportPortableProjectComponent', () => {
  it('should be defined', () => {
    expect(ExportPortableProjectComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ExportPortableProjectComponent.name).toBe('ExportPortableProjectComponent');
  });

  // Note: May require ProjectService
});
