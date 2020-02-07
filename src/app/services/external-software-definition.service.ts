import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { PlatformService } from './platform.service';

@Injectable()
export class ExternalSoftwareDefinitionService {

  constructor(
    private platformService: PlatformService
  ) { }

  get() {
    if (this.platformService.isWindows()) {
      return this.getForWindows();
    }
    if (this.platformService.isDarwin()) {
      return this.getForDarwin();
    }
    return this.getForLinux();
  }

  getForWindows() {
    const software = [{
        name: 'Wireshark',
        locations: [
          'C:\\Program Files\\Wireshark\\Wireshark.exe'
        ],
        type: 'web',
        resource: 'https://1.na.dl.wireshark.org/win64/all-versions/Wireshark-win64-2.6.3.exe',
        binary: 'Wireshark.exe',
        sudo: true,
        installation_arguments: [],
        installed: false,
        installer: true
      }
    ];

    const solarPutty = {
      name: 'SolarPuTTY',
      locations: [
        'SolarPuTTY.exe',
        'external\\SolarPuTTY.exe'
      ],
      type: 'web',
      resource: '',
      binary: 'SolarPuTTY.exe',
      sudo: false,
      installation_arguments: ['--only-ask'],
      installed: false,
      installer: false
    };

    if (environment.solarputty_download_url) {
      solarPutty.resource = environment.solarputty_download_url;
      software.push(solarPutty);
    }

    return software;
  }

  getForLinux() {
    return [];
  }

  getForDarwin() {
    return [];
  }
}
