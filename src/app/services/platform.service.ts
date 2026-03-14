import { Injectable } from '@angular/core';

@Injectable()
export class PlatformService {
  constructor() {}

  isWindows() {
    return navigator.platform.indexOf('Win') > -1;
  }

  isLinux() {
    return navigator.platform.indexOf('Linux') > -1;
  }

  isDarwin() {
    return navigator.platform.indexOf('Mac') > -1;
  }
}
