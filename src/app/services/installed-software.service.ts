import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class InstalledSoftwareService {
  private software = [{
    name: 'ls',
    commands: ['ls'],
    installed: false
  }, {
    name: 'telnet',
    commands: ['telnet'],
    installed: false
  }, {
    name: 'SolarPuTTY',
    commands: [
      'SolarPuTTY.exe'
    ],
    type: 'web',
    resource: 'exe',
    binary: 'SolarPuTTY.exe',
    installed: false
  }];

  constructor(
    private electronService: ElectronService
  ) { }

  list() {
    const installedSoftware = this.electronService.remote.require('./installed-software.js')
      .getInstalledSoftware(this.software);
    
    return this.software.map((software) => {
      software.installed = installedSoftware[software.name].length > 0;
      return software;
    });
  }

  install(software) {
    const installedSoftware = this.electronService.remote.require('./installed-software.js')
      .install(software);
    
  }
}
