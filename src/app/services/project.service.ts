import { Injectable } from '@angular/core';
import { Project } from '../models/project';
import { Node } from '../cartography/models/node';
import { Observable } from 'rxjs';

import { Link } from "../cartography/models/link";
import { Server } from "../models/server";
import { HttpServer } from "./http-server.service";
import { Drawing } from "../cartography/models/drawing";
import { SettingsService } from "./settings.service";

@Injectable()
export class ProjectService {

  constructor(private httpServer: HttpServer,
              private settingsService: SettingsService) { }

  get(server: Server, project_id: string) {
    return this.httpServer
                .get<Project>(server, `/projects/${project_id}`);
  }

  open(server: Server, project_id: string) {
    return this.httpServer
                .post<Project>(server, `/projects/${project_id}/open`, {});
  }

  close(server: Server, project_id: string) {
    return this.httpServer
                .post<Project>(server, `/projects/${project_id}/close`, {});
  }

  list(server: Server) {
    return this.httpServer
                .get<Project[]>(server, '/projects');
  }

  nodes(server: Server, project_id: string) {
    return this.httpServer
                .get<Node[]>(server, `/projects/${project_id}/nodes`);
  }

  links(server: Server, project_id: string) {
    return this.httpServer
                .get<Link[]>(server, `/projects/${project_id}/links`);
  }

  drawings(server: Server, project_id: string) {
    return this.httpServer
                .get<Drawing[]>(server, `/projects/${project_id}/drawings`);
  }

  delete(server: Server, project_id: string): Observable<any> {
    return this.httpServer
                .delete(server, `/projects/${project_id}`);
  }

  notificationsPath(server: Server, project_id: string): string {
    return `ws://${server.ip}:${server.port}/v2/projects/${project_id}/notifications/ws`;
  }

  isReadOnly(project: Project) {
    if (project.readonly) {
      return project.readonly;
    }
    return !this.settingsService.isExperimentalEnabled();
  }
}
