import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class InstalledSoftwareService {
  private software = [{
    name: 'SolarPuTTY',
    locations: [
      'SolarPuTTY.exe'
    ],
    type: 'web',
    resource: '.exe',
    binary: 'SolarPuTTY.exe',
    sudo: false,
    installation_arguments: ['--only-ask'],
    installed: false
  }, {
    name: 'Wireshark',
    locations: [
      'C:\\Program Files\\Wireshark\\Wireshark.exe'
    ],
    type: 'web',
    resource: 'https://1.na.dl.wireshark.org/win64/all-versions/Wireshark-win64-2.6.3.exe',
    binary: 'Wireshark.exe',
    sudo: true,
    installation_arguments: [],
    installed: false
  }];

  constructor(
    private electronService: ElectronService
  ) { 
    this.electronService.ipcRenderer.on('installed-software-installed', (event, data) => {
      console.log("installed", data);
    });
  }

  list() {
    const installedSoftware = this.electronService.remote.require('./installed-software.js')
      .getInstalledSoftware(this.software);
    
    return this.software.map((software) => {
      software.installed = installedSoftware[software.name].length > 0;
      return software;
    });
  }

  install(software) {
    this.electronService.ipcRenderer.send('installed-software-install', software);
  }
}
