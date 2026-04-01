import { TemplateNameDialogComponent } from './template-name-dialog.component';
import { describe, it, expect } from 'vitest';

describe('TemplateNameDialogComponent', () => {
  it('should be defined', () => {
    expect(TemplateNameDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(TemplateNameDialogComponent.name).toBe('TemplateNameDialogComponent');
  });
});
