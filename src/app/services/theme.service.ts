import { EventEmitter, Inject, Injectable, InjectionToken } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Theme type definition
 */
export type ThemeType = 'light' | 'dark';

/**
 * Map theme type (can be 'auto' to follow global theme)
 */
export type MapThemeType = 'light' | 'dark' | 'auto';

/**
 * Token for default theme
 */
export const DEFAULT_THEME_TOKEN = new InjectionToken<ThemeType>('DEFAULT_THEME_TOKEN', {
  providedIn: 'root',
  factory: () => 'dark' as ThemeType
});

/**
 * GNS3 Theme Service
 *
 * Manages application theming with support for:
 * - CSS variable-based theming (new system)
 * - Class-based theming (legacy system for backward compatibility)
 * - Separate map theme (can be independent or follow global theme)
 * - Persistent theme preferences via localStorage
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _darkMode$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  darkMode$: Observable<boolean> = this._darkMode$.asObservable();
  theme$: Observable<[string, boolean]>;

  // Event emitters for backward compatibility
  public themeChanged = new EventEmitter<string>();
  public mapThemeChanged = new EventEmitter<string>();

  // Current theme state
  private currentTheme: ThemeType = 'dark';
  private currentMapTheme: MapThemeType = 'auto';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(DEFAULT_THEME_TOKEN) defaultTheme: ThemeType
  ) {
    // Initialize theme from localStorage or use default
    const savedTheme = localStorage.getItem('theme') as ThemeType | null;
    this.currentTheme = savedTheme || defaultTheme;

    // Initialize map theme
    const savedMapTheme = localStorage.getItem('mapTheme') as MapThemeType | null;
    this.currentMapTheme = savedMapTheme || 'auto';

    // Apply theme on initialization
    this.applyTheme(this.currentTheme);
  }

  /**
   * Get the current global theme
   */
  getActualTheme(): ThemeType {
    return this.currentTheme;
  }

  /**
   * Get the actual map theme (resolves 'auto' to current theme)
   */
  getActualMapTheme(): ThemeType {
    if (this.currentMapTheme === 'auto') {
      return this.currentTheme;
    }
    return this.currentMapTheme;
  }

  /**
   * Set the global theme (legacy method for backward compatibility)
   * @deprecated Use setTheme() instead
   */
  setDarkMode(isDark: boolean): void {
    this.setTheme(isDark ? 'dark' : 'light');
  }

  /**
   * Set the global theme
   * @param theme The theme to apply ('light' | 'dark')
   */
  setTheme(theme: ThemeType): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveThemePreference(theme);

    // Emit legacy event for backward compatibility
    this.themeChanged.emit(theme === 'dark' ? 'dark-theme' : 'light-theme');

    // If map theme is set to auto, notify the map too
    if (this.currentMapTheme === 'auto') {
      this.mapThemeChanged.emit(theme);
    }

    // Update BehaviorSubject
    this._darkMode$.next(theme === 'dark');
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme: ThemeType = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set the map theme independently
   * @param theme The map theme ('light' | 'dark' | 'auto')
   */
  setMapTheme(theme: MapThemeType): void {
    this.currentMapTheme = theme;
    localStorage.setItem('mapTheme', theme);

    // Emit the actual theme (resolving 'auto')
    this.mapThemeChanged.emit(this.getActualMapTheme());
  }

  /**
   * Restore theme preference from localStorage
   * Called on app initialization
   */
  restoreTheme(): void {
    const savedTheme = localStorage.getItem('theme') as ThemeType | null;
    if (savedTheme) {
      this.setTheme(savedTheme);
    }
  }

  /**
   * Apply theme to DOM
   * @param theme The theme to apply
   */
  private applyTheme(theme: ThemeType): void {
    const htmlElement = this.document.documentElement;
    const bodyElement = this.document.body;

    // Remove all theme classes first
    htmlElement.classList.remove('theme-dark', 'theme-light');
    htmlElement.classList.remove('dark-theme', 'light-theme');
    htmlElement.classList.remove('darkTheme', 'lightTheme');

    // Apply new theme class (new system)
    htmlElement.classList.add(`theme-${theme}`);

    // Apply legacy theme class for backward compatibility
    htmlElement.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');

    // Apply theme class to body (some components use this)
    bodyElement.classList.remove('lightTheme', 'darkTheme');
    bodyElement.classList.add(theme === 'dark' ? 'darkTheme' : 'lightTheme');

    // Set background color
    const backgroundColor = theme === 'dark' ? '#20313b' : '#e8ecef';
    bodyElement.style.backgroundColor = backgroundColor;

    // Set CSS variable for background color
    htmlElement.style.setProperty('--gns3-bg-color', backgroundColor);
    htmlElement.style.setProperty('--mat-app-background-color', backgroundColor);

    // Update other CSS variables based on theme
    if (theme === 'dark') {
      this.applyDarkThemeVariables(htmlElement);
    } else {
      this.applyLightThemeVariables(htmlElement);
    }
  }

  /**
   * Apply dark theme specific CSS variables
   */
  private applyDarkThemeVariables(element: HTMLElement): void {
    element.style.setProperty('--gns3-text-color', 'rgba(255, 255, 255, 0.87)');
    element.style.setProperty('--gns3-surface-color', '#263238');
    element.style.setProperty('--gns3-border-color', 'rgba(255, 255, 255, 0.12)');
  }

  /**
   * Apply light theme specific CSS variables
   */
  private applyLightThemeVariables(element: HTMLElement): void {
    element.style.setProperty('--gns3-text-color', 'rgba(0, 0, 0, 0.87)');
    element.style.setProperty('--gns3-surface-color', '#ffffff');
    element.style.setProperty('--gns3-border-color', 'rgba(0, 0, 0, 0.12)');
  }

  /**
   * Save theme preference to localStorage
   */
  private saveThemePreference(theme: ThemeType): void {
    localStorage.setItem('theme', theme);
  }

  /**
   * Check if current theme is dark
   */
  isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  /**
   * Check if current theme is light
   */
  isLightMode(): boolean {
    return this.currentTheme === 'light';
  }
}
