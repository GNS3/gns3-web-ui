import { OpenFileExplorerActionComponent } from './open-file-explorer-action.component';
import { describe, it, expect } from 'vitest';

describe('OpenFileExplorerActionComponent', () => {
  it('should be defined', () => {
    expect(OpenFileExplorerActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(OpenFileExplorerActionComponent.name).toBe('OpenFileExplorerActionComponent');
  });
});
