import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';

@Injectable()
export class BuiltInTemplatesService {
  constructor(private httpServer: HttpServer) {}

  getTemplates(controller: Server): Observable<any[]> {
    return this.httpServer.get<any[]>(controller, '/templates') as Observable<any[]>;
  }

  getTemplate(controller: Server, template_id: string): Observable<any> {
    return this.httpServer.get<any>(controller, `/templates/${template_id}`) as Observable<any>;
  }

  addTemplate(controller: Server, builtInTemplate: any): Observable<any> {
    return this.httpServer.post<any>(controller, `/templates`, builtInTemplate) as Observable<any>;
  }

  saveTemplate(controller: Server, builtInTemplate: any): Observable<any> {
    return this.httpServer.put<any>(
      controller,
      `/templates/${builtInTemplate.template_id}`,
      builtInTemplate
    ) as Observable<any>;
  }
}
