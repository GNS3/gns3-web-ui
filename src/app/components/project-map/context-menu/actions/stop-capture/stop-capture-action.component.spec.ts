import { StopCaptureActionComponent } from './stop-capture-action.component';
import { describe, it, expect } from 'vitest';

describe('StopCaptureActionComponent', () => {
  it('should be defined', () => {
    expect(StopCaptureActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(StopCaptureActionComponent.name).toBe('StopCaptureActionComponent');
  });
});
