import { Injectable } from '@angular/core';
import { ExternalSoftwareDefinitionService } from './external-software-definition.service';

@Injectable()
export class InstalledSoftwareService {
  constructor(private externalSoftwareDefinition: ExternalSoftwareDefinitionService) {}

  list() {
    // Web application - software installation detection not available
    const softwareDefinition = this.externalSoftwareDefinition.get();

    return softwareDefinition.map((software) => {
      software.installed = false;
      return software;
    });
  }
}
