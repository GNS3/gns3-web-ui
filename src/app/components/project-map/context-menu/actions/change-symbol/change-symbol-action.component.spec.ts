import { ChangeSymbolActionComponent } from './change-symbol-action.component';
import { describe, it, expect } from 'vitest';

describe('ChangeSymbolActionComponent', () => {
  it('should be defined', () => {
    expect(ChangeSymbolActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ChangeSymbolActionComponent.name).toBe('ChangeSymbolActionComponent');
  });
});
