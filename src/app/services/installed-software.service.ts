import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class InstalledSoftwareService {
  private software = [{
    name: 'ls',
    commands: ['ls']
  }, {
    name: 'telnet',
    commands: ['telnet']
  }]

  constructor(
    private electronService: ElectronService
  ) { }

  list() {
    const installedSoftware = this.electronService.remote.require('./installed-software.js')
      .getInstalledSoftware(this.software);
    
    return this.software.map((software) => {
      return {
        name: software.name,
        installed: installedSoftware[software.name].length > 0
      }
    });
  }
}
