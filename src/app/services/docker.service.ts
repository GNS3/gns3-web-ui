import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { DockerImage } from '../models/docker/docker-image';
import{ Controller } from '../models/controller';
import { DockerTemplate } from '../models/templates/docker-template';
import { HttpController } from './http-controller.service';

@Injectable()
export class DockerService {
  constructor(private httpServer: HttpController) {}

  getTemplates(controller:Controller ): Observable<DockerTemplate[]> {
    return this.httpServer.get<DockerTemplate[]>(controller, '/templates') as Observable<DockerTemplate[]>;
  }

  getTemplate(controller:Controller , template_id: string): Observable<any> {
    return this.httpServer.get<DockerTemplate>(controller, `/templates/${template_id}`) as Observable<DockerTemplate>;
  }

  getImages(controller:Controller ): Observable<DockerImage[]> {
    return this.httpServer.get<DockerImage[]>(controller, `/computes/${environment.compute_id}/docker/images`) as Observable<DockerImage[]>;
  }

  addTemplate(controller:Controller , dockerTemplate: any): Observable<any> {
    return this.httpServer.post<DockerTemplate>(controller, `/templates`, dockerTemplate) as Observable<DockerTemplate>;
  }

  saveTemplate(controller:Controller , dockerTemplate: any): Observable<any> {
    return this.httpServer.put<DockerTemplate>(
      controller,
      `/templates/${dockerTemplate.template_id}`,
      dockerTemplate
    ) as Observable<DockerTemplate>;
  }
}
