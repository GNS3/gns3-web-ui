import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';

@Injectable()
export class BuiltInTemplatesService {
  constructor(private httpServer: HttpServer) {}

  getTemplates(server: Server): Observable<any[]> {
    return this.httpServer.get<any[]>(server, '/templates') as Observable<any[]>;
  }

  getTemplate(server: Server, template_id: string): Observable<any> {
    return this.httpServer.get<any>(server, `/templates/${template_id}`) as Observable<any>;
  }

  addTemplate(server: Server, builtInTemplate: any): Observable<any> {
    return this.httpServer.post<any>(server, `/templates`, builtInTemplate) as Observable<any>;
  }

  saveTemplate(server: Server, builtInTemplate: any): Observable<any> {
    return this.httpServer.put<any>(
      server,
      `/templates/${builtInTemplate.template_id}`,
      builtInTemplate
    ) as Observable<any>;
  }
}
