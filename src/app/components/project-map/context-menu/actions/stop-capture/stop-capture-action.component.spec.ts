import { describe, it, expect } from 'vitest';
import { StopCaptureActionComponent } from './stop-capture-action.component';

describe('StopCaptureActionComponent', () => {
  describe('prototype methods', () => {
    it('should have stopCapture method', () => {
      expect(typeof (StopCaptureActionComponent.prototype as any).stopCapture).toBe('function');
    });
  });
});
