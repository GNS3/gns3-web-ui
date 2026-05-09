import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Controller } from '@models/controller';
import { VirtualBoxTemplate } from '@models/templates/virtualbox-template';
import { VirtualBoxVm } from '@models/virtualBox/virtual-box-vm';
import { HttpController } from './http-controller.service';

/**
 * @deprecated
 * VirtualBox support is deprecated and will be removed in a future version.
 * This service is no longer maintained and should not be used for new projects.
 *
 * @deprecated Since 3.1.0 - VirtualBox support is being phased out
 */
@Injectable()
export class VirtualBoxService {
  constructor(private httpController: HttpController) {}

  getTemplates(controller: Controller): Observable<VirtualBoxTemplate[]> {
    return this.httpController.get<VirtualBoxTemplate[]>(controller, '/templates') as Observable<VirtualBoxTemplate[]>;
  }

  getTemplate(controller: Controller, template_id: string): Observable<VirtualBoxTemplate> {
    return this.httpController.get<VirtualBoxTemplate>(
      controller,
      `/templates/${template_id}`
    ) as Observable<VirtualBoxTemplate>;
  }

  addTemplate(controller: Controller, virtualBoxTemplate: VirtualBoxTemplate): Observable<VirtualBoxTemplate> {
    const templateToSend = this.prepareTemplate(virtualBoxTemplate);
    return this.httpController.post<VirtualBoxTemplate>(
      controller,
      `/templates`,
      templateToSend
    ) as Observable<VirtualBoxTemplate>;
  }

  saveTemplate(controller: Controller, virtualBoxTemplate: VirtualBoxTemplate): Observable<VirtualBoxTemplate> {
    const templateToSend = this.prepareTemplate(virtualBoxTemplate);
    return this.httpController.put<VirtualBoxTemplate>(
      controller,
      `/templates/${virtualBoxTemplate.template_id}`,
      templateToSend
    ) as Observable<VirtualBoxTemplate>;
  }

  private prepareTemplate(template: VirtualBoxTemplate): VirtualBoxTemplate {
    return {
      ...template,
      custom_adapters: template.custom_adapters || []
    };
  }

  getVirtualMachines(controller: Controller): Observable<VirtualBoxVm[]> {
    return this.httpController.get<VirtualBoxVm[]>(
      controller,
      `/computes/${environment.compute_id}/virtualbox/vms`
    ) as Observable<VirtualBoxVm[]>;
  }
}
