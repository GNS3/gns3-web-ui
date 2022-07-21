import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import{ Controller } from '../models/controller';
import { HttpController } from './http-controller.service';

@Injectable()
export class BuiltInTemplatesService {
  constructor(private httpServer: HttpController) {}

  getTemplates(controller:Controller ): Observable<any[]> {
    return this.httpServer.get<any[]>(controller, '/templates') as Observable<any[]>;
  }

  getTemplate(controller:Controller , template_id: string): Observable<any> {
    return this.httpServer.get<any>(controller, `/templates/${template_id}`) as Observable<any>;
  }

  addTemplate(controller:Controller , builtInTemplate: any): Observable<any> {
    return this.httpServer.post<any>(controller, `/templates`, builtInTemplate) as Observable<any>;
  }

  saveTemplate(controller:Controller , builtInTemplate: any): Observable<any> {
    return this.httpServer.put<any>(
      controller,
      `/templates/${builtInTemplate.template_id}`,
      builtInTemplate
    ) as Observable<any>;
  }
}
