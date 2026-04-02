import { describe, it, expect } from 'vitest';
import { ConsoleComponent } from './console.component';

describe('ConsoleComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConsoleComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have goBack method', () => {
      expect(typeof (ConsoleComponent.prototype as any).goBack).toBe('function');
    });

    it('should have save method', () => {
      expect(typeof (ConsoleComponent.prototype as any).save).toBe('function');
    });
  });
});
