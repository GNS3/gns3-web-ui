import { describe, it, expect } from 'vitest';
import { AiProfileTabComponent } from './ai-profile-tab.component';

describe('AiProfileTabComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).ngOnDestroy).toBe('function');
    });

    it('should have loadConfigs method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).loadConfigs).toBe('function');
    });

    it('should have isEditable method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).isEditable).toBe('function');
    });

    it('should have getProviderDisplay method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).getProviderDisplay).toBe('function');
    });

    it('should have isDefault method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).isDefault).toBe('function');
    });

    it('should have getSourceDisplay method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).getSourceDisplay).toBe('function');
    });

    it('should have openCreateDialog method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).openCreateDialog).toBe('function');
    });

    it('should have openEditDialog method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).openEditDialog).toBe('function');
    });

    it('should have createConfig method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).createConfig).toBe('function');
    });

    it('should have updateConfig method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).updateConfig).toBe('function');
    });

    it('should have deleteConfig method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).deleteConfig).toBe('function');
    });

    it('should have toggleDefaultConfig method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).toggleDefaultConfig).toBe('function');
    });

    it('should have loadConfigsWithoutLoading method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).loadConfigsWithoutLoading).toBe('function');
    });

    it('should have handleConflict method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).handleConflict).toBe('function');
    });

    it('should have handleError method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).handleError).toBe('function');
    });

    it('should have showSuccess method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).showSuccess).toBe('function');
    });

    it('should have showWarning method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).showWarning).toBe('function');
    });

    it('should have showError method', () => {
      expect(typeof (AiProfileTabComponent.prototype as any).showError).toBe('function');
    });
  });
});
