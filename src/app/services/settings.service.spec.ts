import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
    });

    service = new SettingsService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of SettingsService', () => {
      expect(service).toBeInstanceOf(SettingsService);
    });
  });

  describe('Default Settings', () => {
    it('should return false when localStorage has no value (null)', () => {
      // When localStorage returns null, getReportsSettings returns false
      expect(service.getReportsSettings()).toBe(false);
    });

    it('should return false when localStorage has no statistics value', () => {
      expect(service.getStatisticsSettings()).toBe(false);
    });
  });

  describe('setReportsSettings', () => {
    it('should save crash reports setting to localStorage', () => {
      service.setReportsSettings(false);

      expect(mockLocalStorage['crash_reports']).toBe('false');
    });

    it('should save true as string', () => {
      service.setReportsSettings(true);

      expect(mockLocalStorage['crash_reports']).toBe('true');
    });
  });

  describe('getReportsSettings', () => {
    it('should return true when stored as true', () => {
      mockLocalStorage['crash_reports'] = 'true';

      const result = service.getReportsSettings();

      expect(result).toBe(true);
    });

    it('should return false when stored as false', () => {
      mockLocalStorage['crash_reports'] = 'false';

      const result = service.getReportsSettings();

      expect(result).toBe(false);
    });
  });

  describe('setStatisticsSettings', () => {
    it('should save statistics setting to localStorage', () => {
      service.setStatisticsSettings(false);

      expect(mockLocalStorage['statistics_command']).toBe('false');
    });
  });

  describe('getStatisticsSettings', () => {
    it('should return true when stored as true', () => {
      mockLocalStorage['statistics_command'] = 'true';

      const result = service.getStatisticsSettings();

      expect(result).toBe(true);
    });
  });

  describe('setConsoleSettings', () => {
    it('should save console command to localStorage', () => {
      service.setConsoleSettings('putty.exe -telnet');

      expect(mockLocalStorage['console_command']).toBe('putty.exe -telnet');
    });
  });

  describe('getConsoleSettings', () => {
    it('should return stored console command', () => {
      mockLocalStorage['console_command'] = 'putty.exe';

      const result = service.getConsoleSettings();

      expect(result).toBe('putty.exe');
    });

    it('should return null when not set', () => {
      const result = service.getConsoleSettings();

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return settings object', () => {
      const result = service.getAll();

      expect(result).toHaveProperty('crash_reports');
      expect(result).toHaveProperty('console_command');
      expect(result).toHaveProperty('anonymous_statistics');
    });
  });

  describe('setAll', () => {
    it('should update all settings', () => {
      service.setAll({
        crash_reports: false,
        console_command: 'new-command',
        anonymous_statistics: false,
      });

      expect(service.getReportsSettings()).toBe(false);
      expect(service.getConsoleSettings()).toBe('new-command');
      expect(service.getStatisticsSettings()).toBe(false);
    });
  });
});
