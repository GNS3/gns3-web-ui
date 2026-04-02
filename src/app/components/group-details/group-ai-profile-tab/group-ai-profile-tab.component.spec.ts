import { describe, it, expect } from 'vitest';
import { GroupAiProfileTabComponent } from './group-ai-profile-tab.component';

describe('GroupAiProfileTabComponent', () => {
  describe('prototype methods', () => {
    it('should have loadConfigs method', () => {
      expect(typeof (GroupAiProfileTabComponent.prototype as any).loadConfigs).toBe('function');
    });

    it('should have isDefault method', () => {
      expect(typeof (GroupAiProfileTabComponent.prototype as any).isDefault).toBe('function');
    });

    it('should have getProviderDisplay method', () => {
      expect(typeof (GroupAiProfileTabComponent.prototype as any).getProviderDisplay).toBe('function');
    });

    it('should have openCreateDialog method', () => {
      expect(typeof (GroupAiProfileTabComponent.prototype as any).openCreateDialog).toBe('function');
    });

    it('should have openEditDialog method', () => {
      expect(typeof (GroupAiProfileTabComponent.prototype as any).openEditDialog).toBe('function');
    });

    it('should have createConfig method', () => {
      expect(typeof (GroupAiProfileTabComponent.prototype as any).createConfig).toBe('function');
    });

    it('should have updateConfig method', () => {
      expect(typeof (GroupAiProfileTabComponent.prototype as any).updateConfig).toBe('function');
    });

    it('should have deleteConfig method', () => {
      expect(typeof (GroupAiProfileTabComponent.prototype as any).deleteConfig).toBe('function');
    });

    it('should have toggleDefaultConfig method', () => {
      expect(typeof (GroupAiProfileTabComponent.prototype as any).toggleDefaultConfig).toBe('function');
    });

    it('should have ngOnInit method', () => {
      expect(typeof (GroupAiProfileTabComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (GroupAiProfileTabComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });
});
