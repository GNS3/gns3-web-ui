import { TestBed } from '@angular/core/testing';

import { ConsoleService } from './console.service';
import { MockedSettingsService } from '../settings.service.spec';
import { SettingsService } from '../settings.service';
import { DefaultConsoleService } from './default-console.service';

describe('ConsoleService', () => {
  let service: ConsoleService;
  let settings: MockedSettingsService;

  beforeEach(() => {
    let defaultConsoleService = {
      get: () => 'default'
    };
    settings = new MockedSettingsService();
    service = new ConsoleService(defaultConsoleService as any, settings as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get command from settings if defined', () => {
    settings.set('console_command', 'from_settings');
    expect(service.command).toEqual('from_settings');
  });

  it('should get command from default console if settings are not defined', () => {
    settings.set('console_command', undefined);
    expect(service.command).toEqual('default');
  });
});
