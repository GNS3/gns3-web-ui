import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  ConsoleAppearanceSettings,
  DEFAULT_FONT_SIZE,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  XtermService,
} from '@services/xterm.service';

/**
 * Shared terminal appearance settings panel (colors, font size, font family).
 *
 * Reads and writes through XtermService so every open terminal (in-app console
 * tabs and standalone full-window consoles) updates live via settingsChanged$,
 * and the chosen values persist with the user's preferences.
 *
 * The host owns visibility: render it inside an `@if` and hide again on
 * `closed` (emitted when the backdrop is clicked). Anchor offsets can be
 * tuned per host via the `--gns3-terminal-settings-top/right` custom
 * properties; both default to 8px.
 */
@Component({
  selector: 'app-terminal-settings-panel',
  templateUrl: './terminal-settings-panel.component.html',
  styleUrl: './terminal-settings-panel.component.scss',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalSettingsPanelComponent {
  private xtermService = inject(XtermService);
  private cdr = inject(ChangeDetectorRef);

  /** Emitted when the user clicks the backdrop — the host should hide the panel. */
  readonly closed = output<void>();

  private readonly settingsSignal = signal<ConsoleAppearanceSettings>(this.xtermService.settings);

  readonly currentSettings = this.settingsSignal.asReadonly();

  readonly terminalFonts = this.xtermService.getInstalledFonts();
  readonly defaultFontSize = DEFAULT_FONT_SIZE;
  readonly minFontSize = MIN_FONT_SIZE;
  readonly maxFontSize = MAX_FONT_SIZE;

  readonly effectiveBgHex = computed(() => {
    const bg = this.settingsSignal().backgroundColor;
    if (bg) return bg;
    return this.xtermService.getEffectiveBackgroundHex();
  });

  readonly effectiveFgHex = computed(() => {
    const fg = this.settingsSignal().foregroundColor;
    if (fg) return fg;
    return this.xtermService.getEffectiveForegroundHex();
  });

  private applySettings(patch: Partial<ConsoleAppearanceSettings>): void {
    this.xtermService.updateSettings(patch);
    this.settingsSignal.set(this.xtermService.settings);
    this.cdr.markForCheck();
  }

  onBgColorChange(event: Event): void {
    this.applySettings({ backgroundColor: (event.target as HTMLInputElement).value });
  }

  onFgColorChange(event: Event): void {
    this.applySettings({ foregroundColor: (event.target as HTMLInputElement).value });
  }

  resetBgColor(): void {
    this.applySettings({ backgroundColor: null });
  }

  resetFgColor(): void {
    this.applySettings({ foregroundColor: null });
  }

  changeFontSize(delta: number): void {
    this.applySettings({
      fontSize: Math.max(this.minFontSize, Math.min(this.maxFontSize, this.currentSettings().fontSize + delta)),
    });
  }

  resetFontSize(): void {
    this.applySettings({ fontSize: DEFAULT_FONT_SIZE });
  }

  onFontFamilyChange(value: string): void {
    this.applySettings({ fontFamily: value || null });
  }
}
