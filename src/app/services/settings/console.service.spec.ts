import { TestBed } from '@angular/core/testing';
import { SettingsService } from '../settings.service';
import { ConsoleService } from './console.service';

describe('ConsoleService', () => {
  let service: ConsoleService;
  let settings: SettingsService;

  beforeEach(() => {
    let defaultConsoleService = {
      get: () => 'default',
    };
    settings = TestBed.inject(SettingsService);
    service = new ConsoleService(defaultConsoleService as any, settings as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get command from settings if defined', () => {
    settings.setConsoleSettings('from_settings');
    expect(service.command).toEqual('from_settings');
  });

  it('should get command from default console if settings are not defined', () => {
    settings.setConsoleSettings(undefined);
    expect(service.command).toBe('undefined');
  });
});
