import { describe, it, expect } from 'vitest';
import { TextAddedComponent } from './text-added.component';

describe('TextAddedComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (TextAddedComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onTextAdded method', () => {
      expect(typeof (TextAddedComponent.prototype as any).onTextAdded).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (TextAddedComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });
});
