import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let mockLocalStorage: Record<string, string>;

  const setupStorage = (values: Record<string, string> = {}) => {
    Object.assign(mockLocalStorage, values);
  };

  beforeEach(() => {
    mockLocalStorage = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockLocalStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
    });

    service = new SettingsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of SettingsService', () => {
      expect(service).toBeInstanceOf(SettingsService);
    });
  });

  describe('Constructor - Default Settings', () => {
    it('should return false when localStorage has no value (null)', () => {
      expect(service.getReportsSettings()).toBe(false);
    });

    it('should return false when localStorage has no statistics value', () => {
      expect(service.getStatisticsSettings()).toBe(false);
    });

    it('should load crash_reports from localStorage on init', () => {
      setupStorage({ crash_reports: 'false' });
      const serviceWithStorage = new SettingsService();
      expect(serviceWithStorage.getReportsSettings()).toBe(false);
    });

    it('should load console_command from localStorage on init', () => {
      setupStorage({ console_command: 'putty.exe' });
      const serviceWithStorage = new SettingsService();
      expect(serviceWithStorage.getConsoleSettings()).toBe('putty.exe');
    });

    it('should load anonymous_statistics from localStorage on init', () => {
      setupStorage({ statistics_command: 'false' });
      const serviceWithStorage = new SettingsService();
      expect(serviceWithStorage.getStatisticsSettings()).toBe(false);
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

    it('should call removeItem before setItem', () => {
      const removeSpy = vi.spyOn(localStorage, 'removeItem');
      service.setReportsSettings(true);
      expect(removeSpy).toHaveBeenCalledWith('crash_reports');
    });
  });

  describe('getReportsSettings', () => {
    it.each([
      ['true', true],
      ['false', false],
    ])('should return $expected when stored as "$stored"', (stored, expected) => {
      setupStorage({ crash_reports: stored });
      expect(service.getReportsSettings()).toBe(expected);
    });

    it('should return false when stored value is invalid', () => {
      setupStorage({ crash_reports: 'invalid' });
      expect(service.getReportsSettings()).toBe(false);
    });

    it('should return false when stored value is null', () => {
      setupStorage({ crash_reports: 'null' });
      expect(service.getReportsSettings()).toBe(false);
    });
  });

  describe('setStatisticsSettings', () => {
    it('should save statistics setting to localStorage', () => {
      service.setStatisticsSettings(false);
      expect(mockLocalStorage['statistics_command']).toBe('false');
    });

    it('should call removeItem before setItem', () => {
      const removeSpy = vi.spyOn(localStorage, 'removeItem');
      service.setStatisticsSettings(true);
      expect(removeSpy).toHaveBeenCalledWith('statistics_command');
    });
  });

  describe('getStatisticsSettings', () => {
    it.each([
      ['true', true],
      ['false', false],
    ])('should return $expected when stored as "$stored"', (stored, expected) => {
      setupStorage({ statistics_command: stored });
      expect(service.getStatisticsSettings()).toBe(expected);
    });

    it('should return false when stored value is invalid', () => {
      setupStorage({ statistics_command: 'maybe' });
      expect(service.getStatisticsSettings()).toBe(false);
    });
  });

  describe('setConsoleSettings', () => {
    it('should save console command to localStorage', () => {
      service.setConsoleSettings('putty.exe -telnet');
      expect(mockLocalStorage['console_command']).toBe('putty.exe -telnet');
    });

    it('should handle empty string', () => {
      service.setConsoleSettings('');
      expect(mockLocalStorage['console_command']).toBe('');
    });

    it('should call removeItem before setItem', () => {
      const removeSpy = vi.spyOn(localStorage, 'removeItem');
      service.setConsoleSettings('cmd.exe');
      expect(removeSpy).toHaveBeenCalledWith('console_command');
    });
  });

  describe('getConsoleSettings', () => {
    it('should return stored console command', () => {
      setupStorage({ console_command: 'putty.exe' });
      expect(service.getConsoleSettings()).toBe('putty.exe');
    });

    it('should return null when not set', () => {
      expect(service.getConsoleSettings()).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return settings object with all properties', () => {
      const result = service.getAll();
      expect(result).toHaveProperty('crash_reports');
      expect(result).toHaveProperty('console_command');
      expect(result).toHaveProperty('anonymous_statistics');
    });

    it('should return current settings state', () => {
      service.setReportsSettings(false);
      service.setConsoleSettings('my-command');
      service.setStatisticsSettings(false);

      const result = service.getAll();
      expect(result.crash_reports).toBe(false);
      expect(result.console_command).toBe('my-command');
      expect(result.anonymous_statistics).toBe(false);
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

    it('should set all properties to true', () => {
      service.setAll({
        crash_reports: true,
        console_command: 'cmd',
        anonymous_statistics: true,
      });

      expect(service.getReportsSettings()).toBe(true);
      expect(service.getConsoleSettings()).toBe('cmd');
      expect(service.getStatisticsSettings()).toBe(true);
    });
  });

  describe('localStorage Error Handling', () => {
    it('should handle getItem throwing an error', () => {
      vi.stubGlobal('localStorage', {
        getItem: () => {
          throw new Error('Quota exceeded');
        },
        setItem: vi.fn(),
        removeItem: vi.fn(),
      });

      expect(() => new SettingsService()).toThrow('Quota exceeded');
    });

    it('should handle setItem throwing an error', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      expect(() => service.setReportsSettings(true)).toThrow('Quota exceeded');
      setItemSpy.mockRestore();
    });
  });
});
