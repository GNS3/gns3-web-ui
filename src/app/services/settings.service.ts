import { Injectable, EventEmitter } from '@angular/core';
import { PersistenceService, StorageType } from 'angular-persistence';
import { BehaviorSubject } from 'rxjs';

export interface Settings {
  crash_reports: boolean;
  experimental_features: boolean;
  angular_map: boolean;
  console_command: string;
  is_light_theme_enabled: boolean
}

@Injectable()
export class SettingsService {
  static DEFAULTS: Settings = {
    crash_reports: true,
    experimental_features: false,
    angular_map: false,
    console_command: undefined,
    is_light_theme_enabled: false
  };

  private settingsSubject: BehaviorSubject<Settings>;
  public settingsChanges: EventEmitter<Settings> = new EventEmitter();

  constructor(private persistenceService: PersistenceService) {
    this.settingsSubject = new BehaviorSubject<Settings>(this.getAll());
  }

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
    this.settingsSubject.next(this.getAll());
  }

  getAll() {
    const settings = { ...SettingsService.DEFAULTS };
    Object.keys(SettingsService.DEFAULTS).forEach(key => {
      settings[key] = this.get(key);
    });
    return settings;
  }

  setAll(settings) {
    Object.keys(settings).forEach(key => {
      this.set(key, settings[key]);
    });
    this.settingsChanges.emit(settings);
  }

  isExperimentalEnabled(): boolean {
    return this.get('experimental_features');
  }

  subscribe(subscriber: ((settings: Settings) => void)) {
    return this.settingsSubject.subscribe(subscriber);
  }
}
