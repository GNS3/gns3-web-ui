import { describe, it, expect } from 'vitest';
import {
  AiProfileDialogComponent,
  ConfigDialogData,
  ProviderPreset,
  PROVIDER_PRESETS,
  MODEL_TYPES,
  CONTEXT_STRATEGIES,
  COPILOT_MODES,
} from './ai-profile-dialog.component';

describe('AiProfileDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onPresetChange method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).onPresetChange).toBe('function');
    });

    it('should have setPresetMode method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).setPresetMode).toBe('function');
    });

    it('should have onModelChange method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).onModelChange).toBe('function');
    });

    it('should have nameUniqueValidator method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).nameUniqueValidator).toBe('function');
    });

    it('should have getErrorMessage method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).getErrorMessage).toBe('function');
    });

    it('should have hasError method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).hasError).toBe('function');
    });

    it('should have getContextStrategyDescription method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).getContextStrategyDescription).toBe('function');
    });

    it('should have getCopilotModeDescription method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).getCopilotModeDescription).toBe('function');
    });

    it('should have addCustomField method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).addCustomField).toBe('function');
    });

    it('should have removeCustomField method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).removeCustomField).toBe('function');
    });

    it('should have getCustomFieldsControls method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).getCustomFieldsControls).toBe('function');
    });

    it('should have onSubmit method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).onSubmit).toBe('function');
    });

    it('should have onCancel method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).onCancel).toBe('function');
    });

    it('should have openCustomModeHelp method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).openCustomModeHelp).toBe('function');
    });

    it('should have onModeChange method', () => {
      expect(typeof (AiProfileDialogComponent.prototype as any).onModeChange).toBe('function');
    });

    it('should have basicModePresets getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(AiProfileDialogComponent.prototype, 'basicModePresets')?.get).toBe('function');
    });

    it('should have isPresetSelected getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(AiProfileDialogComponent.prototype, 'isPresetSelected')?.get).toBe('function');
    });
  });

  describe('exported constants', () => {
    it('should export PROVIDER_PRESETS', () => {
      expect(Array.isArray(PROVIDER_PRESETS)).toBe(true);
      expect(PROVIDER_PRESETS.length).toBeGreaterThan(0);
    });

    it('should export MODEL_TYPES', () => {
      expect(Array.isArray(MODEL_TYPES)).toBe(true);
      expect(MODEL_TYPES.length).toBeGreaterThan(0);
    });

    it('should export CONTEXT_STRATEGIES', () => {
      expect(Array.isArray(CONTEXT_STRATEGIES)).toBe(true);
      expect(CONTEXT_STRATEGIES.length).toBeGreaterThan(0);
    });

    it('should export COPILOT_MODES', () => {
      expect(Array.isArray(COPILOT_MODES)).toBe(true);
      expect(COPILOT_MODES.length).toBeGreaterThan(0);
    });
  });

  describe('exported types', () => {
    it('should export ConfigDialogData interface', () => {
      const data: ConfigDialogData = {
        mode: 'create',
        config: null,
        existingNames: [],
      };
      expect(data.mode).toBe('create');
      expect(data.existingNames).toEqual([]);
    });
  });
});
