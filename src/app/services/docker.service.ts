import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DockerImage } from '../models/docker/docker-image';
import { Server } from '../models/server';
import { DockerTemplate } from '../models/templates/docker-template';
import { HttpServer } from './http-server.service';

@Injectable()
export class DockerService {
  constructor(private httpServer: HttpServer) {}

  getTemplates(server: Server): Observable<DockerTemplate[]> {
    return this.httpServer.get<DockerTemplate[]>(server, '/templates') as Observable<DockerTemplate[]>;
  }

  getTemplate(server: Server, template_id: string): Observable<any> {
    return this.httpServer.get<DockerTemplate>(server, `/templates/${template_id}`) as Observable<DockerTemplate>;
  }

  getImages(server: Server): Observable<DockerImage[]> {
    return this.httpServer.get<DockerImage[]>(server, '/compute/docker/images') as Observable<DockerImage[]>;
  }

  addTemplate(server: Server, dockerTemplate: any): Observable<any> {
    return this.httpServer.post<DockerTemplate>(server, `/templates`, dockerTemplate) as Observable<DockerTemplate>;
  }

  saveTemplate(server: Server, dockerTemplate: any): Observable<any> {
    return this.httpServer.put<DockerTemplate>(
      server,
      `/templates/${dockerTemplate.template_id}`,
      dockerTemplate
    ) as Observable<DockerTemplate>;
  }
}
