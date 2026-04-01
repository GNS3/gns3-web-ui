import { SymbolsMenuComponent } from './symbols-menu.component';
import { describe, it, expect } from 'vitest';

describe('SymbolsMenuComponent', () => {
  it('should be defined', () => {
    expect(SymbolsMenuComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(SymbolsMenuComponent.name).toBe('SymbolsMenuComponent');
  });
});
