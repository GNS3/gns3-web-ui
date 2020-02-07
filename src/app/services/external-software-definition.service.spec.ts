import { TestBed } from '@angular/core/testing';

import { ExternalSoftwareDefinitionService } from './external-software-definition.service';
import { PlatformService } from './platform.service';

import Spy = jasmine.Spy;

class PlatformServiceMock {
  platform: string;
  isWindows() {
    return this.platform == 'windows';
  }
  isLinux() {
    return this.platform == 'linux';
  }
  isDarwin() {
    return this.platform == 'darwin';
  }
}


describe('ExternalSoftwareDefinitionService', () => {
  let platformServiceMock: PlatformServiceMock;
  let service: ExternalSoftwareDefinitionService;

  beforeEach(() => {
    platformServiceMock = new PlatformServiceMock();
  });

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      ExternalSoftwareDefinitionService,
      { provide: PlatformService, useValue: platformServiceMock}
    ]
  }));

  beforeEach(() => {
    service = TestBed.get(ExternalSoftwareDefinitionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return list for windows', () => {
    const software = service.getForWindows();
    expect(software.length).toEqual(1);
  });

  it('should return list for linux', () => {
    const software = service.getForLinux();
    expect(software.length).toEqual(0);
  });

  it('should return list for darwin', () => {
    const software = service.getForDarwin();
    expect(software.length).toEqual(0);
  });

  describe('ExternalSoftwareDefinitionService.get', () => {
    let windowsSpy: Spy;
    let darwinSpy: Spy;
    let linuxSpy: Spy;

    beforeEach(() => {
      windowsSpy = spyOn(service, 'getForWindows').and.callThrough();
      darwinSpy = spyOn(service, 'getForDarwin').and.callThrough();
      linuxSpy = spyOn(service, 'getForLinux').and.callThrough();
    });

    it('should return list when on windows', () => {
      platformServiceMock.platform = 'windows';
      expect(service.get()).toBeDefined();
      expect(windowsSpy).toHaveBeenCalled();
      expect(darwinSpy).not.toHaveBeenCalled();
      expect(linuxSpy).not.toHaveBeenCalled();
    });

    it('should return list when on linux', () => {
      platformServiceMock.platform = 'linux';
      expect(service.get()).toBeDefined();
      expect(windowsSpy).not.toHaveBeenCalled();
      expect(darwinSpy).not.toHaveBeenCalled();
      expect(linuxSpy).toHaveBeenCalled();
    });

    it('should return list when on darwin', () => {
      platformServiceMock.platform = 'darwin';
      expect(service.get()).toBeDefined();
      expect(windowsSpy).not.toHaveBeenCalled();
      expect(darwinSpy).toHaveBeenCalled();
      expect(linuxSpy).not.toHaveBeenCalled();
    });

  });

});
