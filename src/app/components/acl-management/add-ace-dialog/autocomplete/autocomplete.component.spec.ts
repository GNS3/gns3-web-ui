import { describe, it, expect } from 'vitest';
import { AutocompleteComponent } from './autocomplete.component';

describe('AutocompleteComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnChanges method', () => {
      expect(typeof (AutocompleteComponent.prototype as any).ngOnChanges).toBe('function');
    });
  });
});
