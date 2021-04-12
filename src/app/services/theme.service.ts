import { Injectable, EventEmitter } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _darkMode$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  darkMode$: Observable<boolean> = this._darkMode$.asObservable();
  theme$: Observable<[string, boolean]>;

  public themeChanged = new EventEmitter<string>();
  public savedTheme: string = 'dark';

  constructor() {
    if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'dark');
    this.savedTheme = localStorage.getItem('theme');
  }

  getActualTheme() {
    return this.savedTheme;
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
  }
}
