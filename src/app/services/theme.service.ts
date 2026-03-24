import { EventEmitter, Inject, Injectable, InjectionToken } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Available prebuilt themes
 * - deeppurple-amber: Light theme (deeppurple primary, amber accent)
 * - indigo-pink: Light theme (indigo primary, pink accent)
 * - pink-bluegrey: Dark theme (pink primary, bluegrey accent)
 * - purple-green: Dark theme (purple primary, green accent)
 */
export type PrebuiltTheme = 'deeppurple-amber' | 'indigo-pink' | 'pink-bluegrey' | 'purple-green';

/**
 * Theme type for internal use (maps to light/dark)
 */
export type ThemeType = 'light' | 'dark';

/**
 * Map theme type (can be 'auto' to follow global theme)
 */
export type MapThemeType = 'light' | 'dark' | 'auto';

/**
 * Token for default theme
 */
export const DEFAULT_THEME_TOKEN = new InjectionToken<PrebuiltTheme>('DEFAULT_THEME_TOKEN', {
  providedIn: 'root',
  factory: () => 'pink-bluegrey' as PrebuiltTheme
});

/**
 * GNS3 Theme Service
 *
 * Manages application theming using Angular Material prebuilt themes:
 * - deeppurple-amber: Light theme
 * - indigo-pink: Light theme
 * - pink-bluegrey: Dark theme
 * - purple-green: Dark theme
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
  private currentTheme: PrebuiltTheme = 'pink-bluegrey';
  private currentMapTheme: MapThemeType = 'auto';

  // Public properties for backward compatibility
  public savedTheme: string = 'pink-bluegrey';
  public savedMapTheme: string = 'auto';

  // Dynamic theme link element
  private themeLinkElement: HTMLLinkElement | null = null;

  // All available prebuilt themes
  readonly availableThemes: { key: PrebuiltTheme; label: string; type: ThemeType }[] = [
    { key: 'deeppurple-amber', label: 'Deep Purple & Amber', type: 'light' },
    { key: 'indigo-pink', label: 'Indigo & Pink', type: 'light' },
    { key: 'pink-bluegrey', label: 'Pink & Bluegrey', type: 'dark' },
    { key: 'purple-green', label: 'Purple & Green', type: 'dark' },
  ];

  // Prebuilt theme paths
  private readonly prebuiltThemes: Record<PrebuiltTheme, string> = {
    'deeppurple-amber': 'assets/material-themes/deeppurple-amber.css',
    'indigo-pink': 'assets/material-themes/indigo-pink.css',
    'pink-bluegrey': 'assets/material-themes/pink-bluegrey.css',
    'purple-green': 'assets/material-themes/purple-green.css',
  };

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
    return theme === 'pink-bluegrey' || theme === 'purple-green';
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
      newTheme = this.availableThemes.find(t => t.type === 'light' && t.key.startsWith('deeppurple'))?.key || 'deeppurple-amber';
    } else {
      // Switch to dark theme
      newTheme = this.availableThemes.find(t => t.type === 'dark' && t.key.startsWith('pink'))?.key || 'pink-bluegrey';
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
    if (savedTheme && this.prebuiltThemes[savedTheme]) {
      this.setTheme(savedTheme);
    }
  }

  /**
   * Apply theme to DOM by dynamically loading/unloading the prebuilt theme CSS
   * @param theme The theme key to apply
   */
  private applyTheme(theme: PrebuiltTheme): void {
    const head = this.document.head;
    const existingLinkId = 'angular-material-prebuilt-theme';

    // Remove existing theme link if present
    const existingLink = this.document.getElementById(existingLinkId);
    if (existingLink) {
      existingLink.remove();
    }

    // Remove all theme-related classes from html
    const htmlElement = this.document.documentElement;

    htmlElement.classList.remove('theme-deeppurple-amber', 'theme-indigo-pink', 'theme-pink-bluegrey', 'theme-purple-green');

    // Add theme class to html
    htmlElement.classList.add(`theme-${theme}`);

    // Create and append new theme link
    this.themeLinkElement = this.document.createElement('link');
    this.themeLinkElement.id = existingLinkId;
    this.themeLinkElement.rel = 'stylesheet';
    this.themeLinkElement.href = this.prebuiltThemes[theme];
    head.appendChild(this.themeLinkElement);
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
}
