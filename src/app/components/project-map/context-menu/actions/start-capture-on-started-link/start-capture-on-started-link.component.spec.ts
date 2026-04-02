import { describe, it, expect } from 'vitest';
import { StartCaptureOnStartedLinkActionComponent } from './start-capture-on-started-link.component';

describe('StartCaptureOnStartedLinkActionComponent', () => {
  describe('prototype methods', () => {
    it('should have startCapture method', () => {
      expect(typeof (StartCaptureOnStartedLinkActionComponent.prototype as any).startCapture).toBe('function');
    });
  });
});
