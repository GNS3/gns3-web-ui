import { describe, it, expect } from 'vitest';
import { StartCaptureActionComponent } from './start-capture-action.component';

describe('StartCaptureActionComponent', () => {
  describe('prototype methods', () => {
    it('should have startCapture method', () => {
      expect(typeof (StartCaptureActionComponent.prototype as any).startCapture).toBe('function');
    });
  });
});
