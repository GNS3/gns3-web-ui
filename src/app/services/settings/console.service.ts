import { Injectable } from '@angular/core';
import { SettingsService } from '../settings.service';
import { DefaultConsoleService } from './default-console.service';

@Injectable()
export class ConsoleService {

  constructor(
    private defaultConsoleService: DefaultConsoleService,
    private settingsService: SettingsService
  ) { }

  get command(): string {
    const command = this.settingsService.get<string>('console_command');
    if (command === undefined) {
      return this.defaultConsoleService.get();
    }
    return command;
  }

  set command(command: string) {
    this.settingsService.set<string>('console_command', command);
  }
}
