import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import{ Controller } from '../models/controller';
import { VirtualBoxTemplate } from '../models/templates/virtualbox-template';
import { VirtualBoxVm } from '../models/virtualBox/virtual-box-vm';
import { HttpController } from './http-controller.service';

@Injectable()
export class VirtualBoxService {
  constructor(private httpServer: HttpController) {}

  getTemplates(controller:Controller ): Observable<VirtualBoxTemplate[]> {
    return this.httpServer.get<VirtualBoxTemplate[]>(controller, '/templates') as Observable<VirtualBoxTemplate[]>;
  }

  getTemplate(controller:Controller , template_id: string): Observable<VirtualBoxTemplate> {
    return this.httpServer.get<VirtualBoxTemplate>(
      controller,
      `/templates/${template_id}`
    ) as Observable<VirtualBoxTemplate>;
  }

  addTemplate(controller:Controller , virtualBoxTemplate: VirtualBoxTemplate): Observable<VirtualBoxTemplate> {
    return this.httpServer.post<VirtualBoxTemplate>(
      controller,
      `/templates`,
      virtualBoxTemplate
    ) as Observable<VirtualBoxTemplate>;
  }

  saveTemplate(controller:Controller , virtualBoxTemplate: VirtualBoxTemplate): Observable<VirtualBoxTemplate> {
    return this.httpServer.put<VirtualBoxTemplate>(
      controller,
      `/templates/${virtualBoxTemplate.template_id}`,
      virtualBoxTemplate
    ) as Observable<VirtualBoxTemplate>;
  }

  getVirtualMachines(controller:Controller ): Observable<VirtualBoxVm[]> {
    return this.httpServer.get<VirtualBoxVm[]>(controller, `/computes/${environment.compute_id}/virtualbox/vms`) as Observable<VirtualBoxVm[]>;
  }
}
