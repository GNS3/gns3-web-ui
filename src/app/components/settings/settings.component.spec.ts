import { describe, it, expect } from 'vitest';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (SettingsComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have save method', () => {
      expect(typeof (SettingsComponent.prototype as any).save).toBe('function');
    });

    it('should have setTheme method', () => {
      expect(typeof (SettingsComponent.prototype as any).setTheme).toBe('function');
    });

    it('should have setMapTheme method', () => {
      expect(typeof (SettingsComponent.prototype as any).setMapTheme).toBe('function');
    });

    it('should have checkForUpdates method', () => {
      expect(typeof (SettingsComponent.prototype as any).checkForUpdates).toBe('function');
    });
  });

  describe('prototype getters', () => {
    it('should have lightThemes getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(SettingsComponent.prototype, 'lightThemes')?.get).toBe('function');
    });

    it('should have darkThemes getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(SettingsComponent.prototype, 'darkThemes')?.get).toBe('function');
    });

    it('should have lightMapBackgrounds getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(SettingsComponent.prototype, 'lightMapBackgrounds')?.get).toBe('function');
    });

    it('should have darkMapBackgrounds getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(SettingsComponent.prototype, 'darkMapBackgrounds')?.get).toBe('function');
    });

    it('should have autoMapBackground getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(SettingsComponent.prototype, 'autoMapBackground')?.get).toBe('function');
    });
  });
});
