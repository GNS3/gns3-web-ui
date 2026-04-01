import { StartCaptureDialogComponent } from './start-capture.component';
import { describe, it, expect } from 'vitest';

describe('StartCaptureDialogComponent', () => {
  it('should be defined', () => {
    expect(StartCaptureDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(StartCaptureDialogComponent.name).toBe('StartCaptureDialogComponent');
  });
});
