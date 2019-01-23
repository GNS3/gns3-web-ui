import { TestBed } from '@angular/core/testing';
import { PersistenceService } from 'angular-persistence';

import { SettingsService } from '../../services/settings.service';
import { RavenErrorHandler } from './raven-error-handler';
import { environment } from '../../../environments/environment';

describe('RavenErrorHandler', () => {
  let handler: RavenErrorHandler;
  let settingsService: SettingsService;
  const inProductionOriginal = environment.production;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SettingsService, PersistenceService, RavenErrorHandler]
    });

    settingsService = TestBed.get(SettingsService);
    handler = TestBed.get(RavenErrorHandler);
  });

  afterEach(() => {
    environment.production = inProductionOriginal;
  });

  it('should create', () => {
    expect(handler).toBeTruthy();
  });

  it('should handle error', () => {
    settingsService.set('crash_reports', true);
    environment.production = true;
    expect(handler.shouldSend()).toBeTruthy();
  });

  it('should not handle when crash reports are disabled', () => {
    settingsService.set('crash_reports', false);
    expect(handler.shouldSend()).toBeFalsy();
  });
});
