import { EventEmitter, Inject, Injectable, InjectionToken } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Available theme keys (map to CSS classes in :root.theme-xxx)
 * Light themes: deeppurple-amber, indigo-pink, magenta-violet, rose-red
 * Dark themes: pink-bluegrey, purple-green, azure-blue, cyan-orange
 */
export type PrebuiltTheme = 'deeppurple-amber' | 'indigo-pink' | 'magenta-violet' | 'rose-red' | 'pink-bluegrey' | 'purple-green' | 'azure-blue' | 'cyan-orange';

/**
 * Theme type for internal use (maps to light/dark)
 */
export type ThemeType = 'light' | 'dark';

/**
 * Map theme type (can be 'auto' to follow global theme)
 */
export type MapThemeType = 'light' | 'dark' | 'auto';

/**
 * Map background preset keys
 * Using M3 surface container colors grouped by light/dark type
 */
export type MapBackgroundKey = 'auto' | 'light-1' | 'light-2' | 'light-3' | 'light-4' | 'dark-1' | 'dark-2' | 'dark-3' | 'dark-4';

/**
 * Token for default theme
 */
export const DEFAULT_THEME_TOKEN = new InjectionToken<PrebuiltTheme>('DEFAULT_THEME_TOKEN', {
  providedIn: 'root',
  factory: () => 'deeppurple-amber' as PrebuiltTheme
});

/**
 * GNS3 Theme Service
 *
 * Manages application theming using Angular Material 21 MD3 Sass Mixin:
 * CSS variables are generated via mat.all-component-themes() and injected
 * into :root.theme-xxx selectors.
 *
 * Available themes:
 * Light: deeppurple-amber, indigo-pink, magenta-violet, rose-red
 * Dark: pink-bluegrey, purple-green, azure-blue, cyan-orange
 *
 * Supports persistent theme preferences via localStorage
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _darkMode$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  darkMode$: Observable<boolean> = this._darkMode$.asObservable();

  // Event emitters
  public themeChanged = new EventEmitter<string>();
  public mapThemeChanged = new EventEmitter<string>();

  // Current theme state
  private currentTheme: PrebuiltTheme = 'deeppurple-amber';
  private currentMapTheme: MapThemeType = 'auto';

  // Public properties for backward compatibility
  public savedTheme: string = 'deeppurple-amber';
  public savedMapTheme: string = 'auto';

  // All available prebuilt themes with MD3 palette colors
  readonly availableThemes: { key: PrebuiltTheme; label: string; type: ThemeType; primaryColor: string }[] = [
    // Light themes
    { key: 'deeppurple-amber', label: 'Deep Purple & Amber', type: 'light', primaryColor: '#6750A4' },
    { key: 'indigo-pink', label: 'Indigo & Pink', type: 'light', primaryColor: '#3F51B5' },
    { key: 'magenta-violet', label: 'Magenta & Violet', type: 'light', primaryColor: '#D81B60' },
    { key: 'rose-red', label: 'Rose & Red', type: 'light', primaryColor: '#E91E63' },
    // Dark themes
    { key: 'pink-bluegrey', label: 'Pink & Bluegrey', type: 'dark', primaryColor: '#E91E63' },
    { key: 'purple-green', label: 'Purple & Green', type: 'dark', primaryColor: '#7E57C2' },
    { key: 'azure-blue', label: 'Azure & Blue', type: 'dark', primaryColor: '#0078D4' },
    { key: 'cyan-orange', label: 'Cyan & Orange', type: 'dark', primaryColor: '#00B7C3' },
  ];

  // Available map background presets using gradient colors
  // Light: radial gradient (soft, luminous feel)
  // Dark: linear gradient (deep, rich feel)
  readonly availableMapBackgrounds: { key: MapBackgroundKey; label: string; background: string; textColor: string; type: 'light' | 'dark' }[] = [
    { key: 'auto', label: 'Follow global theme', background: '', textColor: '', type: 'light' },
    // Light backgrounds (radial gradients - soft luminous)
    { key: 'light-1', label: 'Cyan Sky', background: 'radial-gradient(ellipse at 20% 20%, #B2EBF2 0%, #E0F7FA 70%)', textColor: '#006064', type: 'light' },
    { key: 'light-2', label: 'Blue Sky', background: 'radial-gradient(ellipse at 20% 20%, #BBDEFB 0%, #E3F2FD 70%)', textColor: '#1565C0', type: 'light' },
    { key: 'light-3', label: 'Cloud Gray', background: 'radial-gradient(ellipse at 20% 20%, #F5F5F5 0%, #FAFAFA 70%)', textColor: '#424242', type: 'light' },
    { key: 'light-4', label: 'Lavender', background: 'radial-gradient(ellipse at 20% 20%, #E1BEE7 0%, #F3E5F5 70%)', textColor: '#4A148C', type: 'light' },
    // Dark backgrounds (linear gradients - deep rich)
    { key: 'dark-1', label: 'Deep Cyan', background: 'linear-gradient(135deg, #006064 0%, #00838F 50%, #006064 100%)', textColor: '#FFFFFF', type: 'dark' },
    { key: 'dark-2', label: 'Deep Blue', background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #1565C0 100%)', textColor: '#FFFFFF', type: 'dark' },
    { key: 'dark-3', label: 'Charcoal', background: 'linear-gradient(135deg, #424242 0%, #616161 50%, #424242 100%)', textColor: '#FFFFFF', type: 'dark' },
    { key: 'dark-4', label: 'Deep Purple', background: 'linear-gradient(135deg, #4A148C 0%, #6A1B9A 50%, #4A148C 100%)', textColor: '#FFFFFF', type: 'dark' },
  ];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(DEFAULT_THEME_TOKEN) defaultTheme: PrebuiltTheme
  ) {
    // Initialize theme from localStorage or use default
    const savedTheme = localStorage.getItem('theme') as PrebuiltTheme | null;
    this.currentTheme = savedTheme || defaultTheme;
    this.savedTheme = this.currentTheme;

    // Initialize map theme
    const savedMapTheme = localStorage.getItem('mapTheme') as MapThemeType | null;
    this.currentMapTheme = savedMapTheme || 'auto';
    this.savedMapTheme = this.currentMapTheme;

    // Apply theme on initialization
    this.applyTheme(this.currentTheme);
  }

  /**
   * Get the current theme key
   */
  getCurrentTheme(): PrebuiltTheme {
    return this.currentTheme;
  }

  /**
   * Get the current theme type (light or dark)
   */
  getThemeType(): ThemeType {
    return this.isDarkTheme(this.currentTheme) ? 'dark' : 'light';
  }

  /**
   * Get the actual map theme (resolves 'auto' to current theme)
   */
  getActualMapTheme(): ThemeType {
    if (this.currentMapTheme === 'auto') {
      return this.getThemeType();
    }
    return this.currentMapTheme;
  }

  /**
   * Get the current theme type ('light' | 'dark')
   * @deprecated Use getThemeType() instead
   */
  getActualTheme(): ThemeType {
    return this.getThemeType();
  }

  /**
   * Check if a theme is a dark theme
   */
  private isDarkTheme(theme: PrebuiltTheme): boolean {
    return theme === 'pink-bluegrey' || theme === 'purple-green' || theme === 'azure-blue' || theme === 'cyan-orange';
  }

  /**
   * Set the global theme
   * @param theme The theme key to apply
   */
  setTheme(theme: PrebuiltTheme): void {
    if (this.currentTheme === theme) {
      return;
    }

    this.currentTheme = theme;
    this.savedTheme = theme;
    this.applyTheme(theme);
    this.saveThemePreference(theme);

    // Emit events
    this.themeChanged.emit(theme);

    if (this.currentMapTheme === 'auto') {
      this.mapThemeChanged.emit(theme);
    }

    this._darkMode$.next(this.isDarkTheme(theme));
  }

  /**
   * Toggle between a dark and light theme (preserves the accent pairing)
   */
  toggleTheme(): void {
    const currentType = this.getThemeType();
    let newTheme: PrebuiltTheme;

    if (currentType === 'dark') {
      // Switch to light theme
      newTheme = this.availableThemes.find(t => t.type === 'light')?.key || 'deeppurple-amber';
    } else {
      // Switch to dark theme
      newTheme = this.availableThemes.find(t => t.type === 'dark')?.key || 'pink-bluegrey';
    }

    this.setTheme(newTheme);
  }

  /**
   * Set dark mode (legacy method for backward compatibility)
   * @deprecated Use setTheme() instead
   */
  setDarkMode(isDark: boolean): void {
    const targetTheme = isDark ? 'pink-bluegrey' : 'deeppurple-amber';
    this.setTheme(targetTheme);
  }

  /**
   * Set the map theme independently
   * @param theme The map theme ('light' | 'dark' | 'auto')
   */
  setMapTheme(theme: MapThemeType): void {
    this.currentMapTheme = theme;
    this.savedMapTheme = theme;
    localStorage.setItem('mapTheme', theme);

    this.mapThemeChanged.emit(this.getActualMapTheme());
  }

  /**
   * Restore theme preference from localStorage
   */
  restoreTheme(): void {
    const savedTheme = localStorage.getItem('theme') as PrebuiltTheme | null;
    if (savedTheme && this.availableThemes.some(t => t.key === savedTheme)) {
      this.setTheme(savedTheme);
    }
  }

  /**
   * Apply theme to DOM by adding the theme class to html
   * CSS variables are generated via Sass Mixin (mat.all-component-themes)
   * @param theme The theme key to apply
   */
  private applyTheme(theme: PrebuiltTheme): void {
    const htmlElement = this.document.documentElement;

    // Remove all theme-related classes from html
    htmlElement.classList.remove(
      'theme-deeppurple-amber', 'theme-indigo-pink', 'theme-magenta-violet', 'theme-rose-red',
      'theme-pink-bluegrey', 'theme-purple-green', 'theme-azure-blue', 'theme-cyan-orange'
    );

    // Add theme class to html - this activates the CSS variables in :root.theme-xxx
    htmlElement.classList.add(`theme-${theme}`);
  }

  /**
   * Save theme preference to localStorage
   */
  private saveThemePreference(theme: PrebuiltTheme): void {
    localStorage.setItem('theme', theme);
  }

  /**
   * Check if current theme is dark
   */
  isDarkMode(): boolean {
    return this.isDarkTheme(this.currentTheme);
  }

  /**
   * Check if current theme is light
   */
  isLightMode(): boolean {
    return !this.isDarkTheme(this.currentTheme);
  }

  /**
   * Get the appropriate label color for canvas node labels
   * Returns a color that contrasts with the current map background
   */
  getCanvasLabelColor(): string {
    const actualMapTheme = this.getActualMapTheme();
    return actualMapTheme === 'dark' ? '#FFFFFF' : '#000000';
  }
}
