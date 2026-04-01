import { TemplateSymbolDialogComponent } from './template-symbol-dialog.component';
import { describe, it, expect } from 'vitest';

describe('TemplateSymbolDialogComponent', () => {
  it('should be defined', () => {
    expect(TemplateSymbolDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(TemplateSymbolDialogComponent.name).toBe('TemplateSymbolDialogComponent');
  });
});
