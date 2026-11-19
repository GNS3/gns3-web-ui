import { ChangeDetectorRef, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_FONT_SIZE, XtermService } from './xterm.service';
import { ThemeService } from './theme.service';
import { UserPreferencesService } from './user-preferences.service';

const APPEARANCE_STORAGE_KEY = 'gns3_console_appearance';

const mockCssVariables: Record<string, string> = {
  '--mat-sys-surface': '#ffffff',
  '--mat-sys-on-surface': '#000000',
  '--mat-sys-primary-container': '#d9c2ff',
  '--mat-sys-on-primary-container': '#20004f',
  '--mat-sys-primary': '#6200ee',
  '--mat-sys-tertiary': '#03dac6',
  '--mat-sys-error': '#b00020',
  '--mat-sys-outline': '#737373',
  '--mat-sys-surface-variant': '#e0e0e0',
};

describe('XtermService', () => {
  let service: XtermService;
  let mockThemeService: { getActualTheme: ReturnType<typeof vi.fn> };
  let userPreferences: UserPreferencesService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => mockCssVariables[name] || '',
      trim: () => '',
    } as any);

    mockThemeService = {
      getActualTheme: vi.fn().mockReturnValue('light'),
    };

    userPreferences = new UserPreferencesService(Injector.create({ providers: [] }));

    TestBed.configureTestingModule({
      providers: [XtermService, { provide: ThemeService, useValue: mockThemeService }],
    });

    service = TestBed.inject(XtermService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('creates service with default settings', () => {
    expect(service).toBeTruthy();
    expect(service.settings).toEqual({
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: null,
      foregroundColor: null,
      backgroundColor: null,
    });
  });

  it('returns terminal defaults that match new appearance settings', () => {
    const options = service.getDefaultTerminalOptions();

    expect(options.fontSize).toBe(DEFAULT_FONT_SIZE);
    expect(options.fontFamily).toContain('ui-monospace');
    expect(options.cursorBlink).toBe(true);
    expect(options.scrollback).toBe(1000);
  });

  it('loads sanitized settings from localStorage', () => {
    localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({
        fontSize: 99,
        fontFamily: 'Consolas',
        foregroundColor: '#112233',
        backgroundColor: '#aabbcc',
      })
    );

    const loaded = new XtermService(mockThemeService as any, userPreferences);

    expect(loaded.settings).toEqual({
      fontSize: 28,
      fontFamily: 'Consolas',
      foregroundColor: '#112233',
      backgroundColor: '#aabbcc',
    });
  });

  it('drops invalid persisted values while keeping valid ones', () => {
    localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({
        fontSize: 'big',
        fontFamily: 'Unknown Font',
        foregroundColor: 'red',
        backgroundColor: '#ffffff',
      })
    );

    const loaded = new XtermService(mockThemeService as any, userPreferences);

    expect(loaded.settings).toEqual({
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: null,
      foregroundColor: null,
      backgroundColor: '#ffffff',
    });
  });

  it('emits settingsChanged after updateSettings', () => {
    const received: any[] = [];
    service.settingsChanged$.subscribe((value) => received.push(value));

    service.updateSettings({ fontSize: 20, foregroundColor: '#123456' });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({
      fontSize: 20,
      fontFamily: null,
      foregroundColor: '#123456',
      backgroundColor: null,
    });
  });

  it('sanitizes invalid runtime updates', () => {
    service.updateSettings({
      fontSize: -4 as any,
      fontFamily: 'Invalid Font' as any,
      foregroundColor: 'blue' as any,
      backgroundColor: null,
    });

    expect(service.settings).toEqual({
      fontSize: 8,
      fontFamily: null,
      foregroundColor: null,
      backgroundColor: null,
    });
  });

  it('buildTerminalTheme uses custom fg/bg when present', () => {
    service.updateSettings({ foregroundColor: '#101010', backgroundColor: '#f0f0f0' });

    const theme = service.buildTerminalTheme(true);

    expect(theme.foreground).toBe('#101010');
    expect(theme.background).toBe('#f0f0f0');
    expect(theme.selectionBackground).toBe('#d9c2ff');
    expect(theme.selectionForeground).toBe('#20004f');
  });

  it('updates terminal theme and marks for check', () => {
    const terminal = { options: {} } as Terminal;
    const cdr = { markForCheck: vi.fn() } as unknown as ChangeDetectorRef;

    service.updateTerminalTheme(terminal, cdr);

    expect(terminal.options.theme).toBeDefined();
    expect(cdr.markForCheck).toHaveBeenCalled();
  });

  it('applies settings to terminal and triggers fit', () => {
    vi.useFakeTimers();

    const terminal = { options: {} } as Terminal;
    const fitAddon = { fit: vi.fn() } as unknown as FitAddon;

    service.updateSettings({ fontSize: 22, fontFamily: 'Consolas', foregroundColor: '#202020' });
    service.applySettingsToTerminal(terminal, fitAddon);

    expect(terminal.options.fontSize).toBe(22);
    expect(terminal.options.fontFamily).toContain('Consolas');
    expect(terminal.options.theme?.foreground).toBe('#202020');

    vi.advanceTimersByTime(60);
    expect(fitAddon.fit).toHaveBeenCalled();
  });

  it('returns only installed fonts from getInstalledFonts', () => {
    const installSpy = vi
      .spyOn(service as any, '_isFontInstalled')
      .mockImplementation((fontName: string) => fontName === 'Consolas');

    const fonts = service.getInstalledFonts();

    expect(fonts.some((font) => font.value === null)).toBe(true);
    expect(fonts.some((font) => font.value === 'Consolas')).toBe(true);
    expect(fonts.some((font) => font.value === 'Fira Code')).toBe(false);
    expect(installSpy).toHaveBeenCalled();
  });

  it('uses 8.4x17 fallback when character metrics are unavailable', () => {
    const dimensions = service.calculateTerminalDimensions({} as Terminal, 840, 170);

    expect(dimensions.cols).toBe(100);
    expect(dimensions.rows).toBe(10);
  });

  it('returns an immutable copy from settings getter', () => {
    const settings = service.settings;
    settings.fontSize = 21;

    expect(service.settings.fontSize).toBe(DEFAULT_FONT_SIZE);
  });

  it('uses explicit configured colors for effective color getters', () => {
    service.updateSettings({ foregroundColor: '#111111', backgroundColor: '#eeeeee' });

    expect(service.getEffectiveForegroundHex()).toBe('#111111');
    expect(service.getEffectiveBackgroundHex()).toBe('#eeeeee');
  });

  it('resets console appearance to defaults when the stored key is gone (logout wipe)', () => {
    service.updateSettings({ fontSize: 28, fontFamily: 'Hack', foregroundColor: '#123456' });
    const received: any[] = [];
    service.settingsChanged$.subscribe((value) => received.push(value));

    // Logout wipes the mirror (the storage key disappears) and fires the
    // external-update callbacks; the service re-reads and re-broadcasts.
    localStorage.removeItem(APPEARANCE_STORAGE_KEY);
    const callbacks = (TestBed.inject(UserPreferencesService) as any).externalUpdateCallbacks as Set<() => void>;
    for (const callback of callbacks) {
      callback();
    }

    const expected = {
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: null,
      foregroundColor: null,
      backgroundColor: null,
    };
    // The previous user's appearance must not stay in memory…
    expect(service.settings).toEqual(expected);
    // …nor be broadcast to the terminals as the next user's.
    expect(received[received.length - 1]).toEqual(expected);
  });
});
