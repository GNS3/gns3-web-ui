import { Injectable, ChangeDetectorRef } from '@angular/core';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Subject } from 'rxjs';
import { ThemeService } from '@services/theme.service';
import { UserPreferencesService } from './user-preferences.service';

export interface ConsoleAppearanceSettings {
  fontSize: number;
  fontFamily: string | null; // null = use default stack
  foregroundColor: string | null; // null = follow theme
  backgroundColor: string | null; // null = follow theme
}

const APPEARANCE_STORAGE_KEY = 'gns3_console_appearance';
export const DEFAULT_FONT_SIZE = 16;
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 28;
const TERMINAL_FONT_FAMILY =
  "ui-monospace, 'Cascadia Code', 'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, 'Courier New', monospace";

export const TERMINAL_FONTS: { name: string; value: string | null }[] = [
  { name: 'Auto (system monospace)', value: null },
  { name: 'Cascadia Code', value: 'Cascadia Code' },
  { name: 'JetBrains Mono', value: 'JetBrains Mono' },
  { name: 'Fira Code', value: 'Fira Code' },
  { name: 'Source Code Pro', value: 'Source Code Pro' },
  { name: 'Inconsolata', value: 'Inconsolata' },
  { name: 'Ubuntu Mono', value: 'Ubuntu Mono' },
  { name: 'Hack', value: 'Hack' },
  { name: 'Consolas', value: 'Consolas' },
  { name: 'Courier New', value: 'Courier New' },
  { name: 'Menlo', value: 'Menlo' },
];

@Injectable({
  providedIn: 'root',
})
export class XtermService {
  private readonly _allowedFontFamilies = new Set(
    TERMINAL_FONTS.map((font) => font.value).filter((value): value is string => value !== null)
  );
  private readonly _settingsChanged = new Subject<ConsoleAppearanceSettings>();
  readonly settingsChanged$ = this._settingsChanged.asObservable();

  private _settings: ConsoleAppearanceSettings = {
    fontSize: DEFAULT_FONT_SIZE,
    fontFamily: null,
    foregroundColor: null,
    backgroundColor: null,
  };

  constructor(
    private themeService: ThemeService,
    private userPreferences: UserPreferencesService,
  ) {
    this.loadSettings();

    // Re-read and broadcast when a server-side preferences merge updates the
    // stored appearance (open terminals pick the new settings up via
    // settingsChanged$).
    this.userPreferences.onExternalUpdate(() => {
      this.loadSettings();
      this._settingsChanged.next({ ...this._settings });
    });
  }

  get settings(): ConsoleAppearanceSettings {
    return { ...this._settings };
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(APPEARANCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this._settings = this._sanitizeSettings(parsed);
      } else {
        // No stored appearance (never customized, or the previous user's
        // mirror was wiped on logout): fall back to the defaults instead of
        // keeping the previous session's values in memory — the
        // external-update broadcast would otherwise push them to every
        // terminal as the next user's.
        this._settings = {
          fontSize: DEFAULT_FONT_SIZE,
          fontFamily: null,
          foregroundColor: null,
          backgroundColor: null,
        };
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  updateSettings(partial: Partial<ConsoleAppearanceSettings>): void {
    this._settings = this._sanitizeSettings({ ...this._settings, ...partial });
    try {
      this.userPreferences.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(this._settings));
    } catch (e) {
      // Ignore storage errors
    }
    this._settingsChanged.next({ ...this._settings });
  }

  private _sanitizeSettings(candidate: Partial<ConsoleAppearanceSettings>): ConsoleAppearanceSettings {
    return {
      fontSize: this._sanitizeFontSize(candidate.fontSize),
      fontFamily: this._sanitizeFontFamily(candidate.fontFamily),
      foregroundColor: this._sanitizeColor(candidate.foregroundColor),
      backgroundColor: this._sanitizeColor(candidate.backgroundColor),
    };
  }

  private _sanitizeFontSize(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return DEFAULT_FONT_SIZE;
    }
    return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.round(value)));
  }

  private _sanitizeFontFamily(value: unknown): string | null {
    if (value == null) {
      return null;
    }
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    return this._allowedFontFamilies.has(trimmed) ? trimmed : null;
  }

  private _sanitizeColor(value: unknown): string | null {
    if (value == null) {
      return null;
    }
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : null;
  }

  /**
   * Normalize any CSS color value to a #rrggbb hex string for input[type=color].
   * Uses an offscreen canvas to handle oklch, rgb(), named colors, etc.
   */
  resolveColorToHex(color: string): string {
    if (!color) return '#000000';
    if (/^#[0-9a-f]{6}$/i.test(color)) return color;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '#000000';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) {
      return '#000000';
    }
  }

  getCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private _getCssVars(names: string[]): Record<string, string> {
    const style = getComputedStyle(document.documentElement);
    const result: Record<string, string> = {};
    for (const name of names) {
      result[name] = style.getPropertyValue(name).trim();
    }
    return result;
  }

  getEffectiveForegroundHex(): string {
    if (this._settings.foregroundColor) return this._settings.foregroundColor;
    return this.resolveColorToHex(this.getCssVar('--mat-sys-on-surface'));
  }

  getEffectiveBackgroundHex(): string {
    if (this._settings.backgroundColor) return this._settings.backgroundColor;
    return this.resolveColorToHex(this.getCssVar('--mat-sys-surface'));
  }

  buildTerminalTheme(isLight: boolean): Terminal['options']['theme'] {
    const vars = this._getCssVars([
      '--mat-sys-on-surface',
      '--mat-sys-surface',
      '--mat-sys-primary-container',
      '--mat-sys-on-primary-container',
      '--mat-sys-error',
      '--mat-sys-primary',
      '--mat-sys-tertiary',
      '--mat-sys-outline',
      '--mat-sys-surface-variant',
    ]);

    const fg = this._settings.foregroundColor || vars['--mat-sys-on-surface'];
    const bg = this._settings.backgroundColor || vars['--mat-sys-surface'];

    const theme: Terminal['options']['theme'] = {
      background: bg,
      foreground: fg,
      cursor: fg,
      cursorAccent: bg,
      selectionBackground: vars['--mat-sys-primary-container'],
      selectionForeground: vars['--mat-sys-on-primary-container'],
      black: vars['--mat-sys-on-surface'],
      red: vars['--mat-sys-error'],
      green: vars['--mat-sys-primary'],
      yellow: vars['--mat-sys-tertiary'],
      blue: vars['--mat-sys-primary'],
      magenta: vars['--mat-sys-error'],
      cyan: vars['--mat-sys-primary'],
      brightBlack: vars['--mat-sys-outline'],
      brightRed: vars['--mat-sys-error'],
      brightGreen: vars['--mat-sys-primary'],
      brightYellow: vars['--mat-sys-tertiary'],
      brightBlue: vars['--mat-sys-primary'],
      brightMagenta: vars['--mat-sys-error'],
      brightCyan: vars['--mat-sys-primary'],
    };

    if (isLight) {
      theme.white = vars['--mat-sys-surface-variant'];
      theme.brightWhite = vars['--mat-sys-surface'];
    } else {
      theme.white = vars['--mat-sys-on-surface'];
      theme.brightWhite = vars['--mat-sys-surface'];
    }

    return theme;
  }

  updateTerminalTheme(term: Terminal, cdr?: ChangeDetectorRef): void {
    const isLight = this.themeService.getActualTheme() === 'light';
    term.options.theme = this.buildTerminalTheme(isLight);
    cdr?.markForCheck();
  }

  getDefaultTerminalOptions(): Partial<Terminal['options']> {
    return {
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: this._settings.fontSize,
      fontFamily: this._resolveFontFamily(),
      rightClickSelectsWord: true,
      altClickMovesCursor: true,
      scrollback: 1000,
    };
  }

  private _resolveFontFamily(): string {
    if (this._settings.fontFamily) {
      return `'${this._settings.fontFamily}', monospace`;
    }
    return TERMINAL_FONT_FAMILY;
  }

  initTerminal(term: Terminal, fitAddon: FitAddon): void {
    term.loadAddon(fitAddon);
    fitAddon.activate(term);
  }

  /**
   * Returns only fonts that are actually installed on this machine.
   * Uses document.fonts.check() for a synchronous system-font lookup.
   * Unavailable fonts fall back to the same monospace — no visible change.
   */
  getInstalledFonts(): { name: string; value: string | null }[] {
    return TERMINAL_FONTS.filter(font => {
      if (!font.value) return true; // Always keep "Auto"
      return this._isFontInstalled(font.value);
    });
  }

  private _isFontInstalled(fontName: string): boolean {
    try {
      // FontFaceSet.check() returns true for loaded (system) fonts immediately.
      if (document.fonts.check(`16px "${fontName}"`)) return true;
      // Canvas fallback: compare rendered width against bare monospace.
      // A different monospace font will produce a measurably different advance
      // width even though all characters are the same nominal size.
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const probe = 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(2);
      ctx.font = `16px "${fontName}", monospace`;
      const w1 = ctx.measureText(probe).width;
      ctx.font = '16px monospace';
      const w2 = ctx.measureText(probe).width;
      return Math.abs(w1 - w2) > 1;
    } catch {
      return false;
    }
  }

  /**
   * Apply current appearance settings (font size + theme) to an open terminal.
   * Schedules a fit after the font size change so col/row counts update.
   */
  applySettingsToTerminal(term: Terminal, fitAddon?: FitAddon, cdr?: ChangeDetectorRef): void {
    const isLight = this.themeService.getActualTheme() === 'light';
    term.options.fontSize = this._settings.fontSize;
    term.options.fontFamily = this._resolveFontFamily();
    term.options.theme = this.buildTerminalTheme(isLight);
    if (fitAddon) {
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          // Ignore fit errors when element is not visible
        }
      }, 50);
    }
    cdr?.markForCheck();
  }

  calculateTerminalDimensions(
    term: Terminal,
    containerWidth: number,
    containerHeight: number
  ): { cols: number; rows: number } {
    const core = (term as any)._core;
    if (core) {
      const charMeasure = core._charMeasure;
      if (charMeasure && charMeasure.width && charMeasure.height) {
        return {
          cols: Math.floor(containerWidth / charMeasure.width),
          rows: Math.floor(containerHeight / charMeasure.height),
        };
      }
    }
    // Approximate fallback for 14px ui-monospace
    return {
      cols: Math.floor(containerWidth / 8.4),
      rows: Math.floor(containerHeight / 17),
    };
  }
}
