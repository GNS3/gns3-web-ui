import { TestBed, inject, fakeAsync } from '@angular/core/testing';
import { PersistenceService, StorageType } from "angular-persistence";

import { Settings, SettingsService } from './settings.service';


export class MockedSettingsService {
  isExperimentalEnabled() {
    return true;
  }
  getAll() {}
}


describe('SettingsService', () => {
  let persistenceService: PersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SettingsService, PersistenceService]
    });

    persistenceService = TestBed.get(PersistenceService);
  });

  beforeEach(() => {
    persistenceService.removeAll(StorageType.LOCAL);
  });

  it('should be created', inject([SettingsService], (service: SettingsService) => {
    expect(service).toBeTruthy();
  }));

  it('should set value', inject([SettingsService], (service: SettingsService) => {
    service.set('crash_reports', false);
    expect(service.get('crash_reports')).toEqual(false);
  }));

  it('should get default value', inject([SettingsService], (service: SettingsService) => {
    expect(service.get('crash_reports')).toEqual(true);
  }));

  it('should throw error when setting value with wrong key',
    inject([SettingsService], (service: SettingsService) => {
    expect(() => service.set('test', false)).toThrowError("Key 'test' doesn't exist in settings");
  }));

  it('should throw error when getting value with wrong key',
    inject([SettingsService], (service: SettingsService) => {
    expect(() => service.get('test')).toThrowError("Key 'test' doesn't exist in settings");
  }));

  it('should get all values', inject([SettingsService], (service: SettingsService) => {
    expect(service.getAll()).toEqual({
      'crash_reports': true,
      'experimental_features': false
    });
  }));

  it('should set all values', inject([SettingsService], (service: SettingsService) => {
    const settings = {
      'crash_reports': false
    };
    service.setAll(settings);

    expect(service.getAll()).toEqual({
      'crash_reports': false,
      'experimental_features': false
    });
  }));

  it('should execute subscriber', inject([SettingsService], fakeAsync((service: SettingsService) => {
    let changedSettings: Settings;

    service.set('crash_reports', true);
    service.subscribe(settings => {
      changedSettings = settings;
    });
    service.set('crash_reports', false);

    expect(changedSettings.crash_reports).toEqual(false);
  })));

  it('should get isExperimentalEnabled when turned on', inject([SettingsService], (service: SettingsService) => {
    service.set('experimental_features', true);

    expect(service.isExperimentalEnabled()).toEqual(true);
  }));
});
