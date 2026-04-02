import { describe, it, expect } from 'vitest';
import { AiProfileDialogComponent, AiProfileDialogData } from './ai-profile-dialog.component';

describe('AiProfileDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have close method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).close).toBe('function');
    });
  });

  describe('exported types', () => {
    it('should export AiProfileDialogData interface', () => {
      const data: AiProfileDialogData = {
        user: {} as any,
        controller: {} as any,
      };
      expect(data.user).toBeDefined();
      expect(data.controller).toBeDefined();
    });
  });
});
