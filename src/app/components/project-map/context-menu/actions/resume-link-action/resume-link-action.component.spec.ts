import { describe, it, expect } from 'vitest';
import { ResumeLinkActionComponent } from './resume-link-action.component';

describe('ResumeLinkActionComponent', () => {
  describe('prototype methods', () => {
    it('should have resumeLink method', () => {
      expect(typeof (ResumeLinkActionComponent.prototype as any).resumeLink).toBe('function');
    });
  });
});
