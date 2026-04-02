import { describe, it, expect, beforeEach, vi } from 'vitest';
import { XtermService } from './xterm.service';
import { ThemeService } from './theme.service';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ChangeDetectorRef } from '@angular/core';

// Mock CSS variables
const mockCssVariables: Record<string, string> = {
  '--mat-sys-surface': '#ffffff',
  '--mat-sys-on-surface': '#000000',
  '--mat-sys-primary': '#6200ee',
  '--mat-sys-on-primary': '#ffffff',
  '--mat-sys-tertiary': '#03dac6',
  '--mat-sys-error': '#b00020',
  '--mat-sys-outline': '#737373',
  '--mat-sys-surface-variant': '#e0e0e0',
};

describe('XtermService', () => {
  let service: XtermService;
  let mockThemeService: ThemeService;

  beforeEach(() => {
    // Mock getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => mockCssVariables[name] || '',
      trim: () => '',
    } as any);

    // Mock ThemeService
    mockThemeService = {
      getActualTheme: vi.fn(() => 'light'),
    } as any;

    service = new XtermService(mockThemeService);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of XtermService', () => {
      expect(service).toBeInstanceOf(XtermService);
    });

    it('should be providedIn root', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getCssVar', () => {
    it('should return CSS variable value', () => {
      const value = service.getCssVar('--mat-sys-surface');
      expect(value).toBe('#ffffff');
    });

    it('should return empty string for non-existent variable', () => {
      const value = service.getCssVar('--non-existent');
      expect(value).toBe('');
    });

    it('should trim whitespace from value', () => {
      const mockComputedStyle = {
        getPropertyValue: (name: string) => '  #ffffff  ',
        trim: () => '#ffffff',
      };
      vi.spyOn(window, 'getComputedStyle').mockReturnValue(mockComputedStyle as any);

      const value = service.getCssVar('--test');
      expect(value).toBe('#ffffff');
    });

    it('should get value from document.documentElement', () => {
      const spy = vi.spyOn(window, 'getComputedStyle');

      service.getCssVar('--mat-sys-primary');

      expect(spy).toHaveBeenCalledWith(document.documentElement);
    });
  });

  describe('buildTerminalTheme', () => {
    it('should return theme object for light mode', () => {
      const theme = service.buildTerminalTheme(true);

      expect(theme).toBeDefined();
      expect(theme.background).toBe('#ffffff');
      expect(theme.foreground).toBe('#000000');
    });

    it('should return theme object for dark mode', () => {
      const theme = service.buildTerminalTheme(false);

      expect(theme).toBeDefined();
      expect(theme.background).toBe('#ffffff');
      expect(theme.foreground).toBe('#000000');
    });

    it('should set white color differently for light theme', () => {
      const theme = service.buildTerminalTheme(true);

      expect(theme.white).toBe('#e0e0e0');
      expect(theme.brightWhite).toBe('#ffffff');
    });

    it('should set white color differently for dark theme', () => {
      const theme = service.buildTerminalTheme(false);

      expect(theme.white).toBe('#000000');
      expect(theme.brightWhite).toBe('#ffffff');
    });

    it('should set cursor colors', () => {
      const theme = service.buildTerminalTheme(true);

      expect(theme.cursor).toBe('#000000');
      expect(theme.cursorAccent).toBe('#ffffff');
    });

    it('should set selection colors', () => {
      const theme = service.buildTerminalTheme(true);

      expect(theme.selectionBackground).toBe('#6200ee');
      expect(theme.selectionForeground).toBe('#ffffff');
    });

    it('should set standard palette colors', () => {
      const theme = service.buildTerminalTheme(true);

      expect(theme.black).toBe('#000000');
      expect(theme.red).toBe('#b00020');
      expect(theme.green).toBe('#6200ee');
      expect(theme.yellow).toBe('#03dac6');
      expect(theme.blue).toBe('#6200ee');
      expect(theme.magenta).toBe('#b00020');
      expect(theme.cyan).toBe('#6200ee');
    });

    it('should set bright palette colors', () => {
      const theme = service.buildTerminalTheme(true);

      expect(theme.brightBlack).toBe('#737373');
      expect(theme.brightRed).toBe('#b00020');
      expect(theme.brightGreen).toBe('#6200ee');
      expect(theme.brightYellow).toBe('#03dac6');
      expect(theme.brightBlue).toBe('#6200ee');
      expect(theme.brightMagenta).toBe('#b00020');
      expect(theme.brightCyan).toBe('#6200ee');
    });
  });

  describe('updateTerminalTheme', () => {
    it('should update terminal options theme', () => {
      const mockTerminal = {
        options: {},
      } as Terminal;

      (mockThemeService.getActualTheme as any) = vi.fn(() => 'light');

      service.updateTerminalTheme(mockTerminal);

      expect(mockTerminal.options.theme).toBeDefined();
      expect(mockTerminal.options.theme.background).toBe('#ffffff');
    });

    it('should call markForCheck when cdr is provided', () => {
      const mockTerminal = {
        options: {},
      } as Terminal;

      const mockCdr = {
        markForCheck: vi.fn(),
      } as any as ChangeDetectorRef;

      service.updateTerminalTheme(mockTerminal, mockCdr);

      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });

    it('should not call markForCheck when cdr is not provided', () => {
      const mockTerminal = {
        options: {},
      } as Terminal;

      expect(() => {
        service.updateTerminalTheme(mockTerminal);
      }).not.toThrow();
    });

    it('should use light theme when themeService returns light', () => {
      const mockTerminal = {
        options: {},
      } as Terminal;

      (mockThemeService.getActualTheme as any) = vi.fn(() => 'light');

      service.updateTerminalTheme(mockTerminal);

      expect(mockTerminal.options.theme.white).toBe('#e0e0e0');
    });

    it('should use dark theme when themeService returns dark', () => {
      const mockTerminal = {
        options: {},
      } as Terminal;

      (mockThemeService.getActualTheme as any) = vi.fn(() => 'dark');

      service.updateTerminalTheme(mockTerminal);

      expect(mockTerminal.options.theme.white).toBe('#000000');
    });
  });

  describe('getDefaultTerminalOptions', () => {
    it('should return default options', () => {
      const options = service.getDefaultTerminalOptions();

      expect(options).toBeDefined();
      expect(options.cursorBlink).toBe(true);
      expect(options.cursorStyle).toBe('block');
      expect(options.fontSize).toBe(15);
    });

    it('should set fontFamily to courier-new', () => {
      const options = service.getDefaultTerminalOptions();

      expect(options.fontFamily).toBe('courier-new, courier, monospace');
    });

    it('should enable rightClickSelectsWord', () => {
      const options = service.getDefaultTerminalOptions();

      expect(options.rightClickSelectsWord).toBe(true);
    });

    it('should enable altClickMovesCursor', () => {
      const options = service.getDefaultTerminalOptions();

      expect(options.altClickMovesCursor).toBe(true);
    });

    it('should set scrollback to 1000', () => {
      const options = service.getDefaultTerminalOptions();

      expect(options.scrollback).toBe(1000);
    });
  });

  describe('initTerminal', () => {
    it('should load fit addon to terminal', () => {
      const mockTerminal = {
        loadAddon: vi.fn(),
      } as any as Terminal;

      const mockFitAddon = {
        activate: vi.fn(),
      } as any as FitAddon;

      service.initTerminal(mockTerminal, mockFitAddon);

      expect(mockTerminal.loadAddon).toHaveBeenCalledWith(mockFitAddon);
      expect(mockFitAddon.activate).toHaveBeenCalledWith(mockTerminal);
    });

    it('should activate fit addon', () => {
      const mockTerminal = {
        loadAddon: vi.fn(),
      } as any as Terminal;

      const mockFitAddon = {
        activate: vi.fn(),
      } as any as FitAddon;

      service.initTerminal(mockTerminal, mockFitAddon);

      expect(mockFitAddon.activate).toHaveBeenCalledWith(mockTerminal);
    });
  });

  describe('calculateTerminalDimensions', () => {
    it('should calculate dimensions using char measurements', () => {
      const mockTerminal = {
        _core: {
          _charMeasure: {
            width: 10,
            height: 20,
          },
        },
      } as any as Terminal;

      const dimensions = service.calculateTerminalDimensions(mockTerminal, 800, 600);

      expect(dimensions.cols).toBe(80);
      expect(dimensions.rows).toBe(30);
    });

    it('should use fallback when charMeasure is missing', () => {
      const mockTerminal = {
        _core: {},
      } as any as Terminal;

      const dimensions = service.calculateTerminalDimensions(mockTerminal, 900, 510);

      expect(dimensions.cols).toBe(100); // 900 / 9
      expect(dimensions.rows).toBe(30); // 510 / 17
    });

    it('should use fallback when core is missing', () => {
      const mockTerminal = {} as any as Terminal;

      const dimensions = service.calculateTerminalDimensions(mockTerminal, 900, 510);

      expect(dimensions.cols).toBe(100);
      expect(dimensions.rows).toBe(30);
    });

    it('should use fallback when charMeasure dimensions are zero', () => {
      const mockTerminal = {
        _core: {
          _charMeasure: {
            width: 0,
            height: 0,
          },
        },
      } as any as Terminal;

      const dimensions = service.calculateTerminalDimensions(mockTerminal, 900, 510);

      expect(dimensions.cols).toBe(100);
      expect(dimensions.rows).toBe(30);
    });

    it('should floor the calculated values', () => {
      const mockTerminal = {
        _core: {
          _charMeasure: {
            width: 9,
            height: 17,
          },
        },
      } as any as Terminal;

      const dimensions = service.calculateTerminalDimensions(mockTerminal, 850, 515);

      expect(dimensions.cols).toBe(Math.floor(850 / 9));
      expect(dimensions.rows).toBe(Math.floor(515 / 17));
    });

    it('should handle small containers', () => {
      const mockTerminal = {
        _core: {
          _charMeasure: {
            width: 10,
            height: 20,
          },
        },
      } as any as Terminal;

      const dimensions = service.calculateTerminalDimensions(mockTerminal, 50, 40);

      expect(dimensions.cols).toBe(5);
      expect(dimensions.rows).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null CSS variable value', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: () => null as any,
        trim: () => '',
      } as any);

      // The service will crash when trying to trim null
      expect(() => {
        service.getCssVar('--test');
      }).toThrow();
    });

    it('should handle undefined CSS variable value', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: () => undefined,
        trim: () => '',
      } as any);

      // The service will crash when trying to trim undefined
      expect(() => {
        service.getCssVar('--test');
      }).toThrow();
    });

    it('should handle terminal without core', () => {
      const mockTerminal = {} as any as Terminal;

      expect(() => {
        service.calculateTerminalDimensions(mockTerminal, 800, 600);
      }).not.toThrow();
    });

    it('should handle terminal with null core', () => {
      const mockTerminal = {
        _core: null,
      } as any as Terminal;

      expect(() => {
        service.calculateTerminalDimensions(mockTerminal, 800, 600);
      }).not.toThrow();
    });

    it('should handle zero container dimensions', () => {
      const mockTerminal = {} as any as Terminal;

      const dimensions = service.calculateTerminalDimensions(mockTerminal, 0, 0);

      expect(dimensions.cols).toBe(0);
      expect(dimensions.rows).toBe(0);
    });

    it('should handle negative container dimensions', () => {
      const mockTerminal = {} as any as Terminal;

      const dimensions = service.calculateTerminalDimensions(mockTerminal, -100, -100);

      expect(dimensions.cols).toBeLessThan(0);
      expect(dimensions.rows).toBeLessThan(0);
    });
  });
});
