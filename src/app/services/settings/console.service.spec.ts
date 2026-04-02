import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConsoleService } from './console.service';
import { SettingsService } from '../settings.service';
import { DefaultConsoleService } from './default-console.service';

describe('ConsoleService', () => {
  let consoleService: ConsoleService;
  let mockSettingsService: {
    getConsoleSettings: any;
    setConsoleSettings: any;
  };
  let mockDefaultConsoleService: {
    get: any;
  };

  beforeEach(() => {
    mockSettingsService = {
      getConsoleSettings: vi.fn(),
      setConsoleSettings: vi.fn(),
    };
    mockDefaultConsoleService = {
      get: vi.fn(),
    };
    consoleService = new ConsoleService(
      mockDefaultConsoleService as unknown as DefaultConsoleService,
      mockSettingsService as unknown as SettingsService
    );
  });

  describe('constructor', () => {
    it('should create the service', () => {
      expect(consoleService).toBeTruthy();
    });

    it('should be instance of ConsoleService', () => {
      expect(consoleService).toBeInstanceOf(ConsoleService);
    });
  });

  describe('command getter', () => {
    it('should return user-set command when available', () => {
      vi.mocked(mockSettingsService.getConsoleSettings!).mockReturnValue('putty.exe');
      expect(consoleService.command).toBe('putty.exe');
    });

    it('should call settingsService.getConsoleSettings', () => {
      mockSettingsService.getConsoleSettings!.mockReturnValue('cmd.exe');
      consoleService.command;
      expect(mockSettingsService.getConsoleSettings).toHaveBeenCalled();
    });

    it('should return default command when user has not set any', () => {
      mockSettingsService.getConsoleSettings!.mockReturnValue(undefined);
      mockDefaultConsoleService.get!.mockReturnValue(undefined);
      expect(consoleService.command).toBeUndefined();
    });

    it('should call defaultConsoleService.get when settings returns undefined', () => {
      mockSettingsService.getConsoleSettings!.mockReturnValue(undefined);
      mockDefaultConsoleService.get!.mockReturnValue('default-terminal');
      expect(consoleService.command).toBe('default-terminal');
    });
  });

  describe('command setter', () => {
    it('should delegate to settingsService.setConsoleSettings', () => {
      consoleService.command = 'my-command';
      expect(mockSettingsService.setConsoleSettings).toHaveBeenCalledWith('my-command');
    });

    it.each(['putty.exe', 'cmd.exe', 'telnet localhost', ''])(
      'should pass "%s" to settingsService.setConsoleSettings',
      (command) => {
        consoleService.command = command;
        expect(mockSettingsService.setConsoleSettings).toHaveBeenCalledWith(command);
      }
    );
  });
});
