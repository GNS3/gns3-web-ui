import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Settings {
  crash_reports: boolean;
  console_command: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private settings: Settings = {
    crash_reports: true,
    console_command: undefined,
  };

  private readonly reportsSettings: string = 'crash_reports';
  private readonly consoleSettings: string = 'console_command';

  constructor() {
    if (this.getItem(this.reportsSettings))
      this.settings.crash_reports = this.getItem(this.reportsSettings) === 'true' ? true : false;

    if (this.getItem(this.consoleSettings))
      this.settings.console_command = this.getItem(this.consoleSettings);
  }

  setReportsSettings(value: boolean) {
    this.settings.crash_reports = value;
    this.removeItem(this.reportsSettings);
    if (value) {
      this.setItem(this.reportsSettings, 'true');
    } else {
      this.setItem(this.reportsSettings, 'false');
    }
  }

  getReportsSettings() {
    return this.getItem(this.reportsSettings) === 'true' ? true : false;
  }

  setConsoleSettings(value: string) {
    this.settings.console_command = value;
    this.removeItem(this.consoleSettings);
    this.setItem(this.consoleSettings, value);
  }

  getConsoleSettings() {
    return this.getItem(this.consoleSettings);
  }

  removeItem(key: string) {
    localStorage.removeItem(key);
  }

  setItem(key: string, item: string) {
    localStorage.setItem(key, item);
  }

  getItem(item: string) {
    return localStorage.getItem(item);
  }

  getAll() {
    return this.settings;
  }

  setAll(settings: Settings) {
    this.settings = settings;
    this.setConsoleSettings(settings.console_command);
    this.setReportsSettings(settings.crash_reports);
  }
}
