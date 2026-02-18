import { Injectable } from '@angular/core';

@Injectable()
export class DockerConfigurationService {
  getConsoleTypes() {
    return ['telnet', 'vnc', 'http', 'https', 'none'];
  }

  getAuxConsoleTypes() {
    return ['telnet', 'none'];
  }

  getCategories() {
    let categories = [
      ['Default', 'guest'],
      ['Routers', 'router'],
      ['Switches', 'switch'],
      ['End devices', 'guest'],
      ['Security devices', 'firewall'],
    ];

    return categories;
  }

  getConsoleResolutions() {
    let consoleResolutions = ['2560x1440', '1920x1080', '1680x1050', '1440x900', '1366x768', '1280x1024', '1280x800', '1024x768', '800x600', '640x480'];

    return consoleResolutions;
  }

  getMacAddrRegex() {
    return /^([0-9a-fA-F]{2}[:]){5}([0-9a-fA-F]{2})$/;
  }
}
