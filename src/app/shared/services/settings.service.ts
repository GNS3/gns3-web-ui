import { Injectable } from '@angular/core';
import { PersistenceService, StorageType } from "angular-persistence";

@Injectable()
export class SettingsService {
  static DEFAULTS = {
    'crash_reports': true
  };

  constructor(private persistenceService: PersistenceService) { }

  get<T>(key: string) {
    if (!(key in SettingsService.DEFAULTS)) {
      throw Error(`Key '${key}' doesn't exist in settings`);
    }
    const value = this.persistenceService.get(key, StorageType.LOCAL) as T;
    if (typeof value === 'undefined') {
      return SettingsService.DEFAULTS[key];
    }
    return value;
  }

  set<T>(key: string, value: T): void {
    if (!(key in SettingsService.DEFAULTS)) {
      throw Error(`Key '${key}' doesn't exist in settings`);
    }
    this.persistenceService.set(key, value, { type: StorageType.LOCAL });
  }

  getAll() {
    const settings = { ...SettingsService.DEFAULTS };
    Object.keys(SettingsService.DEFAULTS).forEach((key) => {
      settings[key] = this.get(key);
    });
    return settings;
  }

  setAll(settings) {
    Object.keys(settings).forEach((key) => {
      this.set(key, settings[key]);
    });
  }
}
