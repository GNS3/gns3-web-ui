import { Injectable } from '@angular/core';

@Injectable()
export class PlatformService {
  isWindows() {
    return navigator.userAgent.indexOf('Win') !== -1;
  }

  isLinux() {
    return navigator.userAgent.indexOf('Linux') !== -1;
  }

  isDarwin() {
    return navigator.userAgent.indexOf('Mac') !== -1;
  }
}
