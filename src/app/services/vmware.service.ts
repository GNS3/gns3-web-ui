import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Controller } from '@models/controller';
import { VmwareTemplate } from '@models/templates/vmware-template';
import { VmwareVm } from '@models/vmware/vmware-vm';
import { HttpController } from './http-controller.service';

@Injectable()
export class VmwareService {
  constructor(private httpController: HttpController) {}

  getTemplates(controller: Controller): Observable<VmwareTemplate[]> {
    return this.httpController.get<VmwareTemplate[]>(controller, '/templates') as Observable<VmwareTemplate[]>;
  }

  getTemplate(controller: Controller, template_id: string): Observable<VmwareTemplate> {
    return this.httpController.get<VmwareTemplate>(
      controller,
      `/templates/${template_id}`
    ) as Observable<VmwareTemplate>;
  }

  addTemplate(controller: Controller, vmwareTemplate: VmwareTemplate): Observable<VmwareTemplate> {
    const templateToSend = this.prepareTemplate(vmwareTemplate);
    return this.httpController.post<VmwareTemplate>(
      controller,
      `/templates`,
      templateToSend
    ) as Observable<VmwareTemplate>;
  }

  saveTemplate(controller: Controller, vmwareTemplate: VmwareTemplate): Observable<VmwareTemplate> {
    const templateToSend = this.prepareTemplate(vmwareTemplate);
    return this.httpController.put<VmwareTemplate>(
      controller,
      `/templates/${vmwareTemplate.template_id}`,
      templateToSend
    ) as Observable<VmwareTemplate>;
  }

  private prepareTemplate(template: VmwareTemplate): VmwareTemplate {
    return {
      ...template,
      custom_adapters: template.custom_adapters || []
    };
  }

  getVirtualMachines(controller: Controller): Observable<VmwareVm[]> {
    return this.httpController.get<VmwareVm[]>(
      controller,
      `/computes/${environment.compute_id}/vmware/vms`
    ) as Observable<VmwareVm[]>;
  }
}
