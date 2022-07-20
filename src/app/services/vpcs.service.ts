import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Server } from '../models/server';
import { VpcsTemplate } from '../models/templates/vpcs-template';
import { HttpServer } from './http-server.service';

@Injectable()
export class VpcsService {
  constructor(private httpServer: HttpServer) {}

  getTemplates(controller: Server): Observable<VpcsTemplate[]> {
    return this.httpServer.get<VpcsTemplate[]>(controller, '/templates') as Observable<VpcsTemplate[]>;
  }

  getTemplate(controller: Server, template_id: string): Observable<VpcsTemplate> {
    return this.httpServer.get<VpcsTemplate>(controller, `/templates/${template_id}`) as Observable<VpcsTemplate>;
  }

  addTemplate(controller: Server, vpcsTemplate: VpcsTemplate): Observable<VpcsTemplate> {
    return this.httpServer.post<VpcsTemplate>(controller, `/templates`, vpcsTemplate) as Observable<VpcsTemplate>;
  }

  saveTemplate(controller: Server, vpcsTemplate: VpcsTemplate): Observable<VpcsTemplate> {
    return this.httpServer.put<VpcsTemplate>(
      controller,
      `/templates/${vpcsTemplate.template_id}`,
      vpcsTemplate
    ) as Observable<VpcsTemplate>;
  }
}
