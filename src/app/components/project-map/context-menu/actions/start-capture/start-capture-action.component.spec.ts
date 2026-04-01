import { StartCaptureActionComponent } from './start-capture-action.component';
import { describe, it, expect } from 'vitest';

describe('StartCaptureActionComponent', () => {
  it('should be defined', () => {
    expect(StartCaptureActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(StartCaptureActionComponent.name).toBe('StartCaptureActionComponent');
  });
});
