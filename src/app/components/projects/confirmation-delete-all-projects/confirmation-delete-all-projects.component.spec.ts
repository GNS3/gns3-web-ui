import { describe, it, expect } from 'vitest';
import { ConfirmationDeleteAllProjectsComponent } from './confirmation-delete-all-projects.component';

describe('ConfirmationDeleteAllProjectsComponent', () => {
  describe('prototype methods', () => {
    it('should have deleteAll method', () => {
      expect(typeof (ConfirmationDeleteAllProjectsComponent.prototype as any).deleteAll).toBe('function');
    });

    it('should have deleteFile method', () => {
      expect(typeof (ConfirmationDeleteAllProjectsComponent.prototype as any).deleteFile).toBe('function');
    });
  });
});
