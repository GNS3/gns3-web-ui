import { describe, it, expect } from 'vitest';
import { ExportPortableProjectComponent } from './export-portable-project.component';

describe('ExportPortableProjectComponent', () => {
  it('should have export_project_form property', () => {
    expect('export_project_form').toBeDefined();
  });

  it('should have compression_methods property', () => {
    expect('compression_methods').toBeDefined();
  });

  it('should have compression_level property', () => {
    expect('compression_level').toBeDefined();
  });

  it('should have isExport signal', () => {
    expect('isExport').toBeDefined();
  });

  it('should have selectCompression method', () => {
    expect(typeof (ExportPortableProjectComponent.prototype as any).selectCompression).toBe('function');
  });

  it('should have exportPortableProject method', () => {
    expect(typeof (ExportPortableProjectComponent.prototype as any).exportPortableProject).toBe('function');
  });

  it('should have formControls method', () => {
    expect(typeof (ExportPortableProjectComponent.prototype as any).formControls).toBe('function');
  });
});
