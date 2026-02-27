import { Injectable } from '@angular/core';
import { SettingsService } from '../settings.service';

/**
 * Console service for web-only mode.
 * Default console management has been removed as part of Electron removal.
 */
@Injectable()
export class ConsoleService {
  constructor(private settingsService: SettingsService) {}

  get command(): string {
    const command = this.settingsService.getConsoleSettings();
    if (command === undefined) {
      // Return empty string as default in web-only mode
      return '';
    }
    return command;
  }

  set command(command: string) {
    this.settingsService.setConsoleSettings(command);
  }
}
