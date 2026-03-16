import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _darkMode$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  darkMode$: Observable<boolean> = this._darkMode$.asObservable();
  theme$: Observable<[string, boolean]>;

  public themeChanged = new EventEmitter<string>();
  public mapThemeChanged = new EventEmitter<string>();
  public savedTheme: string = 'dark';
  /** 'light' | 'dark' | 'auto' — 'auto' means follow the global theme */
  public savedMapTheme: string = 'auto';

  constructor() {
    if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'dark');
    this.savedTheme = localStorage.getItem('theme');
     
    if (!localStorage.getItem('mapTheme')) localStorage.setItem('mapTheme', 'auto');
    this.savedMapTheme = localStorage.getItem('mapTheme');
  }

  getActualTheme() {
    return this.savedTheme;
  }

    /** Returns the resolved map theme ('light' or 'dark'), honouring 'auto'. */
  getActualMapTheme(): string {
    if (this.savedMapTheme === 'auto') return this.savedTheme;
    return this.savedMapTheme;
  }
 
  setDarkMode(value: boolean) {
    if (value) {
      this.savedTheme = 'dark';
      this.themeChanged.emit('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      this.savedTheme = 'light';
      this.themeChanged.emit('light-theme');
      localStorage.setItem('theme', 'light');
    }
        // If map theme is set to auto, notify the map too so it follows the change.
    if (this.savedMapTheme === 'auto') {
      this.mapThemeChanged.emit(this.savedTheme);
    }
  }
 
  setMapTheme(theme: 'light' | 'dark' | 'auto') {
    this.savedMapTheme = theme;
    localStorage.setItem('mapTheme', theme);
    this.mapThemeChanged.emit(this.getActualMapTheme());
  }
}
