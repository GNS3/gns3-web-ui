import { describe, it, expect } from 'vitest';
import { GroupAiProfileDialogComponent } from './group-ai-profile-dialog.component';

describe('GroupAiProfileDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have close method', () => {
      expect(typeof (GroupAiProfileDialogComponent.prototype as any).close).toBe('function');
    });
  });
});
