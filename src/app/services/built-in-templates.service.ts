import { Injectable } from "@angular/core";
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { Observable } from 'rxjs';
import { EthernetHubTemplate } from '../models/templates/ethernet-hub-template';

@Injectable()
export class BuiltInTemplatesService {
    constructor(private httpServer: HttpServer) {}

    getTemplates(server: Server): Observable<any[]> {
        return this.httpServer.get<any[]>(server, '/templates') as Observable<any[]>;
    }

    getTemplate(server: Server, template_id: string): Observable<any> {
        return this.httpServer.get<any>(server, `/templates/${template_id}`) as Observable<any>;
    }

    addTemplate(server: Server, ethernetHubTemplate: any): Observable<any> {
        return this.httpServer.post<any>(server, `/templates`, ethernetHubTemplate) as Observable<any>;
    }

    saveTemplate(server: Server, ethernetHubTemplate: any): Observable<any> {
        return this.httpServer.put<any>(server, `/templates/${ethernetHubTemplate.template_id}`, ethernetHubTemplate) as Observable<any>;

    }
}
