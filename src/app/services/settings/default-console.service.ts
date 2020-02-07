import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable()
export class DefaultConsoleService {

  constructor(
    private electronService: ElectronService
  ) { }

  get() {
    if (!this.electronService.isElectronApp) {
      return undefined;
    }

    if (this.electronService.isLinux) {
      return 'xfce4-terminal --tab -T "%d" -e "telnet %h %p"';
    }

    if (this.electronService.isWindows) {
      return 'putty.exe -telnet %h %p -loghost "%d"';
    }

    return undefined;
  }
}
