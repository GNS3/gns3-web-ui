import { TestBed } from '@angular/core/testing';
import { SettingsService } from '../settings.service';
import { ConsoleService } from './console.service';

describe('ConsoleService', () => {
  let service: ConsoleService;
  let settings: SettingsService;

  beforeEach(() => {
    settings = TestBed.inject(SettingsService);
    service = new ConsoleService(settings);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get command from settings if defined', () => {
    settings.setConsoleSettings('from_settings');
    expect(service.command).toEqual('from_settings');
  });

  it('should get empty string if settings are not defined', () => {
    localStorage.removeItem('console_command');
    expect(service.command).toBe('');
  });
});
