import { Injectable } from '@angular/core';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ThemeService } from '@services/theme.service';
import { ChangeDetectorRef } from '@angular/core';

/**
 * Service to manage shared xterm functionality
 * Provides theme management and terminal utilities
 */
@Injectable({
  providedIn: 'root',
})
export class XtermService {
  constructor(private themeService: ThemeService) {}

  /**
   * Get CSS variable value from document
   */
  getCssVar(name: string): string {
    const styles = getComputedStyle(document.documentElement);
    return styles.getPropertyValue(name).trim();
  }

  /**
   * Build terminal theme based on current Material Design 3 theme
   */
  buildTerminalTheme(isLight: boolean): Terminal['options']['theme'] {
    const theme: Terminal['options']['theme'] = {
      background: this.getCssVar('--mat-sys-surface'),
      foreground: this.getCssVar('--mat-sys-on-surface'),
      cursor: this.getCssVar('--mat-sys-on-surface'),
      cursorAccent: this.getCssVar('--mat-sys-surface'),
      selectionBackground: this.getCssVar('--mat-sys-primary'),
      selectionForeground: this.getCssVar('--mat-sys-on-primary'),
      black: this.getCssVar('--mat-sys-on-surface'),
      red: this.getCssVar('--mat-sys-error'),
      green: this.getCssVar('--mat-sys-primary'),
      yellow: this.getCssVar('--mat-sys-tertiary'),
      blue: this.getCssVar('--mat-sys-primary'),
      magenta: this.getCssVar('--mat-sys-error'),
      cyan: this.getCssVar('--mat-sys-primary'),
      brightBlack: this.getCssVar('--mat-sys-outline'),
      brightRed: this.getCssVar('--mat-sys-error'),
      brightGreen: this.getCssVar('--mat-sys-primary'),
      brightYellow: this.getCssVar('--mat-sys-tertiary'),
      brightBlue: this.getCssVar('--mat-sys-primary'),
      brightMagenta: this.getCssVar('--mat-sys-error'),
      brightCyan: this.getCssVar('--mat-sys-primary'),
    };

    // Only white/brightWhite differ between light and dark themes
    if (isLight) {
      theme.white = this.getCssVar('--mat-sys-surface-variant');
      theme.brightWhite = this.getCssVar('--mat-sys-surface');
    } else {
      theme.white = this.getCssVar('--mat-sys-on-surface');
      theme.brightWhite = this.getCssVar('--mat-sys-surface');
    }

    return theme;
  }

  /**
   * Update terminal theme based on current Material Design 3 theme
   */
  updateTerminalTheme(term: Terminal, cdr?: ChangeDetectorRef): void {
    const isLight = this.themeService.getActualTheme() === 'light';
    term.options.theme = this.buildTerminalTheme(isLight);
    cdr?.markForCheck();
  }

  /**
   * Get default terminal options
   */
  getDefaultTerminalOptions(): Partial<Terminal['options']> {
    return {
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 15,
      fontFamily: 'courier-new, courier, monospace',
      rightClickSelectsWord: true,
      altClickMovesCursor: true,
      scrollback: 1000,
    };
  }

  /**
   * Initialize terminal with fit addon
   */
  initTerminal(term: Terminal, fitAddon: FitAddon): void {
    term.loadAddon(fitAddon);
    fitAddon.activate(term);
  }

  /**
   * Calculate terminal dimensions based on container size
   * Uses the actual character dimensions from the terminal
   */
  calculateTerminalDimensions(
    term: Terminal,
    containerWidth: number,
    containerHeight: number
  ): { cols: number; rows: number } {
    // Get actual character dimensions from terminal
    // The terminal provides measurement via its internal metrics
    const core = (term as any)._core;
    if (core) {
      const charMeasure = core._charMeasure;
      if (charMeasure && charMeasure.width && charMeasure.height) {
        const cols = Math.floor(containerWidth / charMeasure.width);
        const rows = Math.floor(containerHeight / charMeasure.height);
        return { cols, rows };
      }
    }

    // Fallback: use approximate values based on default font size
    // This is less accurate but provides a reasonable fallback
    const charWidth = 9; // Approximate for 15px courier-new
    const charHeight = 17; // Approximate for 15px courier-new
    return {
      cols: Math.floor(containerWidth / charWidth),
      rows: Math.floor(containerHeight / charHeight),
    };
  }
}
