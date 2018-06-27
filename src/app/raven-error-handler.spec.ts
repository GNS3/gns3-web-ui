import { TestBed } from '@angular/core/testing';
import { PersistenceService } from "angular-persistence";

import * as Raven from 'raven-js';

import { SettingsService } from "./services/settings.service";
import { RavenErrorHandler } from "./raven-error-handler";
import { environment } from "../environments/environment";


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
    const error = new Error("My error");
    const captureException = spyOn(Raven, 'captureException');
    environment.production = true;
    handler.handleError(error);
    expect(captureException).toHaveBeenCalledWith(error);
  });

  it('should not handle when not in production', () => {
    const captureException = spyOn(Raven, 'captureException');
    environment.production = false;
    handler.handleError(new Error("My error"));
    expect(captureException).not.toHaveBeenCalled();
  });
});
