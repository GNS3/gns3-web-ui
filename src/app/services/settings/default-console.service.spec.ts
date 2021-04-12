import { DefaultConsoleService } from './default-console.service';

describe('DefaultConsoleService', () => {
  let electronService;
  let service: DefaultConsoleService;
  beforeEach(() => {
    electronService = {
      isElectronApp: false,
      isWindows: false,
      isLinux: false,
    };
  });

  beforeEach(() => {
    service = new DefaultConsoleService(electronService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return undefined when not running in electron', () => {
    electronService.isElectronApp = false;
    expect(service.get()).toBeUndefined();
  });

  it('should return console for windows', () => {
    electronService.isElectronApp = true;
    electronService.isWindows = true;
    expect(service.get()).toEqual('putty.exe -telnet %h %p -loghost "%d"');
  });

  it('should return console for linux', () => {
    electronService.isElectronApp = true;
    electronService.isLinux = true;
    expect(service.get()).toEqual('xfce4-terminal --tab -T "%d" -e "telnet %h %p"');
  });

  it('should return undefined for other platforms', () => {
    electronService.isElectronApp = true;
    expect(service.get()).toBeUndefined();
  });
});
