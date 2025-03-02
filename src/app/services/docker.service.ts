import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { DockerImage } from '../models/docker/docker-image';
import { Controller } from '../models/controller';
import { DockerTemplate } from '../models/templates/docker-template';
import { HttpController } from './http-controller.service';

@Injectable()
export class DockerService {
  constructor(private httpController: HttpController) {}

  getTemplates(controller: Controller ): Observable<DockerTemplate[]> {
    return this.httpController.get<DockerTemplate[]>(controller, '/templates') as Observable<DockerTemplate[]>;
  }

  getTemplate(controller: Controller, template_id: string): Observable<any> {
    return this.httpController.get<DockerTemplate>(controller, `/templates/${template_id}`) as Observable<DockerTemplate>;
  }

  getImages(controller: Controller ): Observable<DockerImage[]> {
    return this.httpController.get<DockerImage[]>(controller, `/computes/${environment.compute_id}/docker/images`) as Observable<DockerImage[]>;
  }

  addTemplate(controller: Controller, dockerTemplate: any): Observable<any> {
    return this.httpController.post<DockerTemplate>(controller, `/templates`, dockerTemplate) as Observable<DockerTemplate>;
  }

  saveTemplate(controller: Controller, dockerTemplate: any): Observable<any> {
    return this.httpController.put<DockerTemplate>(
      controller,
      `/templates/${dockerTemplate.template_id}`,
      dockerTemplate
    ) as Observable<DockerTemplate>;
  }
}
