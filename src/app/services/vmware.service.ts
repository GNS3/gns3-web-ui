import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Server } from '../models/server';
import { VmwareTemplate } from '../models/templates/vmware-template';
import { VmwareVm } from '../models/vmware/vmware-vm';
import { HttpServer } from './http-server.service';

@Injectable()
export class VmwareService {
  constructor(private httpServer: HttpServer) {}

  getTemplates(server: Server): Observable<VmwareTemplate[]> {
    return this.httpServer.get<VmwareTemplate[]>(server, '/templates') as Observable<VmwareTemplate[]>;
  }

  getTemplate(server: Server, template_id: string): Observable<VmwareTemplate> {
    return this.httpServer.get<VmwareTemplate>(server, `/templates/${template_id}`) as Observable<VmwareTemplate>;
  }

  addTemplate(server: Server, vmwareTemplate: VmwareTemplate): Observable<VmwareTemplate> {
    return this.httpServer.post<VmwareTemplate>(server, `/templates`, vmwareTemplate) as Observable<VmwareTemplate>;
  }

  saveTemplate(server: Server, vmwareTemplate: VmwareTemplate): Observable<VmwareTemplate> {
    return this.httpServer.put<VmwareTemplate>(
      server,
      `/templates/${vmwareTemplate.template_id}`,
      vmwareTemplate
    ) as Observable<VmwareTemplate>;
  }

  getVirtualMachines(server: Server): Observable<VmwareVm[]> {
    return this.httpServer.get<VmwareVm[]>(server, '/compute/vmware/vms') as Observable<VmwareVm[]>;
  }
}
