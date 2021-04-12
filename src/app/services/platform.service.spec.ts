import { TestBed } from '@angular/core/testing';
import { ElectronService } from 'ngx-electron';
import { PlatformService } from './platform.service';

class ElectronServiceMock {
  process = {
    platform: 'unknown',
  };
}

describe('PlatformService', () => {
  let electronServiceMock: ElectronServiceMock;
  let service: PlatformService;

  beforeEach(() => {
    electronServiceMock = new ElectronServiceMock();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlatformService, { provide: ElectronService, useValue: electronServiceMock }],
    });
  });

  beforeEach(() => {
    service = TestBed.get(PlatformService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be on windows platform', () => {
    electronServiceMock.process.platform = 'win32';
    expect(service.isWindows()).toBeTruthy();
    expect(service.isDarwin()).toBeFalsy();
    expect(service.isLinux()).toBeFalsy();
  });

  it('should be on linux platform', () => {
    electronServiceMock.process.platform = 'linux';
    expect(service.isWindows()).toBeFalsy();
    expect(service.isDarwin()).toBeFalsy();
    expect(service.isLinux()).toBeTruthy();
  });

  it('should be on darwin platform', () => {
    electronServiceMock.process.platform = 'darwin';
    expect(service.isWindows()).toBeFalsy();
    expect(service.isDarwin()).toBeTruthy();
    expect(service.isLinux()).toBeFalsy();
  });
});
