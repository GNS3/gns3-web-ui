import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ExternalSoftwareDefinitionService } from './external-software-definition.service';

@Injectable()
export class InstalledSoftwareService {
  constructor(
    private electronService: ElectronService,
    private externalSoftwareDefinition: ExternalSoftwareDefinitionService
  ) { }

  list() {
    const softwareDefinition = this.externalSoftwareDefinition.get();

    const installedSoftware = this.electronService.remote.require('./installed-software.js')
      .getInstalledSoftware(softwareDefinition);
    
    return softwareDefinition.map((software) => {
      software.installed = installedSoftware[software.name].length > 0;
      return software;
    });
  }

}
