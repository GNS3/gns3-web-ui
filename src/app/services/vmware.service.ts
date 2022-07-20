import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Server } from '../models/server';
import { VmwareTemplate } from '../models/templates/vmware-template';
import { VmwareVm } from '../models/vmware/vmware-vm';
import { HttpServer } from './http-server.service';

@Injectable()
export class VmwareService {
  constructor(private httpServer: HttpServer) {}

  getTemplates(controller: Server): Observable<VmwareTemplate[]> {
    return this.httpServer.get<VmwareTemplate[]>(controller, '/templates') as Observable<VmwareTemplate[]>;
  }

  getTemplate(controller: Server, template_id: string): Observable<VmwareTemplate> {
    return this.httpServer.get<VmwareTemplate>(controller, `/templates/${template_id}`) as Observable<VmwareTemplate>;
  }

  addTemplate(controller: Server, vmwareTemplate: VmwareTemplate): Observable<VmwareTemplate> {
    return this.httpServer.post<VmwareTemplate>(controller, `/templates`, vmwareTemplate) as Observable<VmwareTemplate>;
  }

  saveTemplate(controller: Server, vmwareTemplate: VmwareTemplate): Observable<VmwareTemplate> {
    return this.httpServer.put<VmwareTemplate>(
      controller,
      `/templates/${vmwareTemplate.template_id}`,
      vmwareTemplate
    ) as Observable<VmwareTemplate>;
  }

  getVirtualMachines(controller: Server): Observable<VmwareVm[]> {
    return this.httpServer.get<VmwareVm[]>(controller, `/computes/${environment.compute_id}/vmware/vms`) as Observable<VmwareVm[]>;
  }
}
