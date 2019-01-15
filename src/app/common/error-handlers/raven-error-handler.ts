import { ErrorHandler, Inject, Injector } from '@angular/core';

import { SettingsService } from '../../services/settings.service';
import { environment } from '../../../environments/environment';
import { RavenState } from './raven-state-communicator';

export class RavenErrorHandler implements ErrorHandler {
  constructor(@Inject(Injector) protected injector: Injector) {}

  handleError(err: any): void {
    RavenState.shouldSend = this.shouldSend();

    console.error(err.originalError || err);
  }

  shouldSend() {
    const settingsService: SettingsService = this.injector.get(SettingsService);
    return environment.production && settingsService.get('crash_reports');
  }
}
