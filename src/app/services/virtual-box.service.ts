import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';
import { Server } from '../models/server';
import { VirtualBoxTemplate } from '../models/templates/virtualbox-template';
import { VirtualBoxVm } from '../models/virtualBox/virtual-box-vm';
import { HttpServer } from './http-server.service';

@Injectable()
export class VirtualBoxService {
    constructor(private httpServer: HttpServer) {}

    getTemplates(server: Server): Observable<VirtualBoxTemplate[]> {
        return this.httpServer.get<VirtualBoxTemplate[]>(server, '/templates') as Observable<VirtualBoxTemplate[]>;
    }

    getTemplate(server: Server, template_id: string): Observable<VirtualBoxTemplate> {
        return this.httpServer.get<VirtualBoxTemplate>(server, `/templates/${template_id}`) as Observable<VirtualBoxTemplate>;
    }

    addTemplate(server: Server, virtualBoxTemplate: VirtualBoxTemplate): Observable<VirtualBoxTemplate> {
        return this.httpServer.post<VirtualBoxTemplate>(server, `/templates`, virtualBoxTemplate) as Observable<VirtualBoxTemplate>;
    }

    saveTemplate(server: Server, virtualBoxTemplate: VirtualBoxTemplate): Observable<VirtualBoxTemplate> {
        return this.httpServer.put<VirtualBoxTemplate>(server, `/templates/${virtualBoxTemplate.template_id}`, virtualBoxTemplate) as Observable<VirtualBoxTemplate>;
    }

    getVirtualMachines(server: Server): Observable<VirtualBoxVm[]> {
        return this.httpServer.get<VirtualBoxVm[]>(server, '/compute/virtualbox/vms') as Observable<VirtualBoxVm[]>;
    }
}
