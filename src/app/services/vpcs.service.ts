import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import{ Controller } from '../models/controller';
import { VpcsTemplate } from '../models/templates/vpcs-template';
import { HttpController } from './http-controller.service';

@Injectable()
export class VpcsService {
  constructor(private httpController: HttpController) {}

  getTemplates(controller:Controller ): Observable<VpcsTemplate[]> {
    return this.httpController.get<VpcsTemplate[]>(controller, '/templates') as Observable<VpcsTemplate[]>;
  }

  getTemplate(controller:Controller , template_id: string): Observable<VpcsTemplate> {
    return this.httpController.get<VpcsTemplate>(controller, `/templates/${template_id}`) as Observable<VpcsTemplate>;
  }

  addTemplate(controller:Controller , vpcsTemplate: VpcsTemplate): Observable<VpcsTemplate> {
    return this.httpController.post<VpcsTemplate>(controller, `/templates`, vpcsTemplate) as Observable<VpcsTemplate>;
  }

  saveTemplate(controller:Controller , vpcsTemplate: VpcsTemplate): Observable<VpcsTemplate> {
    return this.httpController.put<VpcsTemplate>(
      controller,
      `/templates/${vpcsTemplate.template_id}`,
      vpcsTemplate
    ) as Observable<VpcsTemplate>;
  }
}
