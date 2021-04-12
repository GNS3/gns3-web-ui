import { Injectable } from '@angular/core';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { VpcsTemplate } from '../models/templates/vpcs-template';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable()
export class VpcsService {
  constructor(private httpServer: HttpServer) {}

  getTemplates(server: Server): Observable<VpcsTemplate[]> {
    return this.httpServer.get<VpcsTemplate[]>(server, '/templates') as Observable<VpcsTemplate[]>;
  }

  getTemplate(server: Server, template_id: string): Observable<VpcsTemplate> {
    return this.httpServer.get<VpcsTemplate>(server, `/templates/${template_id}`) as Observable<VpcsTemplate>;
  }

  addTemplate(server: Server, vpcsTemplate: VpcsTemplate): Observable<VpcsTemplate> {
    return this.httpServer.post<VpcsTemplate>(server, `/templates`, vpcsTemplate) as Observable<VpcsTemplate>;
  }

  saveTemplate(server: Server, vpcsTemplate: VpcsTemplate): Observable<VpcsTemplate> {
    return this.httpServer.put<VpcsTemplate>(
      server,
      `/templates/${vpcsTemplate.template_id}`,
      vpcsTemplate
    ) as Observable<VpcsTemplate>;
  }
}
