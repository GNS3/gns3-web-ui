import * as Raven from 'raven-js';

import { ErrorHandler, Inject, Injector } from "@angular/core";

import { SettingsService } from "./shared/services/settings.service";
import { environment } from "../environments/environment";


export class RavenErrorHandler implements ErrorHandler {
  constructor(@Inject(Injector) private injector: Injector) {}

  handleError(err: any): void {
    const settingsService: SettingsService = this.injector.get(SettingsService);
    console.error(err.originalError || err);

    if (environment.production && settingsService.get('crash_reports')) {
      Raven.captureException(err.originalError || err);
    }
  }
}
