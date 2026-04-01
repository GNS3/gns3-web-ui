import { StartCaptureOnStartedLinkActionComponent } from './start-capture-on-started-link.component';
import { describe, it, expect } from 'vitest';

describe('StartCaptureOnStartedLinkActionComponent', () => {
  it('should be defined', () => {
    expect(StartCaptureOnStartedLinkActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(StartCaptureOnStartedLinkActionComponent.name).toBe('StartCaptureOnStartedLinkActionComponent');
  });
});
