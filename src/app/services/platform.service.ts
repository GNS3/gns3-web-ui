import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable()
export class PlatformService {
  constructor(private electronService: ElectronService) {}

  isWindows() {
    return this.electronService.process.platform === 'win32';
  }

  isLinux() {
    return this.electronService.process.platform === 'linux';
  }

  isDarwin() {
    return this.electronService.process.platform === 'darwin';
  }
}
