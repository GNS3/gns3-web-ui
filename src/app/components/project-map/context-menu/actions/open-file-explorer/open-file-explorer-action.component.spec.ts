import { describe, it, expect } from 'vitest';
import { OpenFileExplorerActionComponent } from './open-file-explorer-action.component';

describe('OpenFileExplorerActionComponent', () => {
  describe('prototype methods', () => {
    it('should have open method', () => {
      expect(typeof (OpenFileExplorerActionComponent.prototype as any).open).toBe('function');
    });
  });
});
