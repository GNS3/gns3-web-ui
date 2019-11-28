import { Injectable } from '@angular/core';
import { Project } from '../models/project';
import { Node } from '../cartography/models/node';
import { Observable } from 'rxjs';
import { Link } from '../models/link';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { Drawing } from '../cartography/models/drawing';
import { SettingsService } from './settings.service';

@Injectable()
export class ProjectService {
  constructor(private httpServer: HttpServer, private settingsService: SettingsService) {}

  get(server: Server, project_id: string) {
    return this.httpServer.get<Project>(server, `/projects/${project_id}`);
  }

  open(server: Server, project_id: string) {
    return this.httpServer.post<Project>(server, `/projects/${project_id}/open`, {});
  }

  close(server: Server, project_id: string) {
    return this.httpServer.post<Project>(server, `/projects/${project_id}/close`, {});
  }

  list(server: Server) {
    return this.httpServer.get<Project[]>(server, '/projects');
  }

  nodes(server: Server, project_id: string) {
    return this.httpServer.get<Node[]>(server, `/projects/${project_id}/nodes`);
  }

  links(server: Server, project_id: string) {
    return this.httpServer.get<Link[]>(server, `/projects/${project_id}/links`);
  }

  drawings(server: Server, project_id: string) {
    return this.httpServer.get<Drawing[]>(server, `/projects/${project_id}/drawings`);
  }

  add(server: Server, project_name: string, project_id: string): Observable<any> {
    return this.httpServer.post<Project>(server, `/projects`, { name: project_name, project_id: project_id });
  }

  update(server: Server, project: Project) : Observable<Project> {
    return this.httpServer.put<Project>(server, `/projects/${project.project_id}`, {
      auto_close: project.auto_close,
      auto_open: project.auto_open,
      auto_start: project.auto_start,
      drawing_grid_size: project.drawing_grid_size,
      grid_size: project.grid_size,
      name: project.name,
      scene_width: project.scene_width,
      scene_height: project.scene_height,
      show_interface_labels: project.show_interface_labels
    });
  }

  delete(server: Server, project_id: string): Observable<any> {
    return this.httpServer.delete(server, `/projects/${project_id}`);
  }

  getUploadPath(server: Server, uuid: string, project_name: string) {
    return `http://${server.host}:${server.port}/v2/projects/${uuid}/import?name=${project_name}`;
  }

  getExportPath(server: Server, project: Project) {
    return `http://${server.host}:${server.port}/v2/projects/${project.project_id}/export`;
  }

  export(server: Server, project_id: string): Observable<any> {
    return this.httpServer.get(server, `/projects/${project_id}/export`)
  }

  getStatistics(server: Server, project_id: string): Observable<any> {
    return this.httpServer.get(server, `/projects/${project_id}/stats`);
  }
  
  duplicate(server: Server, project_id: string, project_name): Observable<any> {
    return this.httpServer.post(server, `/projects/${project_id}/duplicate`, { name: project_name });
  }

  notificationsPath(server: Server, project_id: string): string {
    return `ws://${server.host}:${server.port}/v2/projects/${project_id}/notifications/ws`;
  }

  isReadOnly(project: Project) {
    if (project.readonly) {
      return project.readonly;
    }
    return false;
  }
}
