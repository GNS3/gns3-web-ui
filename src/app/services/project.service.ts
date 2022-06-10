import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable, Subject } from 'rxjs';
import { Drawing } from '../cartography/models/drawing';
import { Node } from '../cartography/models/node';
import { Link } from '../models/link';
import { Project } from '../models/project';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { RecentlyOpenedProjectService } from './recentlyOpenedProject.service';
import { SettingsService } from './settings.service';

@Injectable()
export class ProjectService {
  compression_methods: any = [
    { id: 1, value: 'none', name: 'None' },
    { id: 2, value: 'zip compression (deflate)', name: 'Zip compression (deflate)' },
    { id: 3, value: 'bzip2 compression', name: 'Bzip2 compression' },
    { id: 4, value: 'lzma compression', name: 'Lzma compression' },
    { id: 5, value: 'zstandard compression', name: 'Zstandard compression' },
  ];
  compression_level_default_value: any = [
    { id: 1, name: 'none', value: 'None', selectionValues: ['None'] },
    { id: 2, name: 'zip compression (deflate)', value: 6, selectionValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { id: 3, name: 'bzip2 compression', value: 9, selectionValues: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { id: 4, name: 'lzma compression', value: 'None', selectionValues: ['None'] },
    {
      id: 5,
      name: 'zstandard compression',
      value: 3,
      selectionValues: [1, 2, 3, 4, 5, 6, 7, 8, 9.1, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    },
  ];

  public projectListSubject = new Subject<boolean>();
  constructor(
    private httpServer: HttpServer,
    private settingsService: SettingsService,
    private recentlyOpenedProjectService: RecentlyOpenedProjectService
  ) {}

  projectListUpdated() {
    this.projectListSubject.next(true);
  }

  getReadmeFile(server: Server, project_id: string) {
    return this.httpServer.getText(server, `/projects/${project_id}/files/README.txt`);
  }

  postReadmeFile(server: Server, project_id: string, readme: string) {
    return this.httpServer.post<any>(server, `/projects/${project_id}/files/README.txt`, readme);
  }

  get(server: Server, project_id: string) {
    return this.httpServer.get<Project>(server, `/projects/${project_id}`);
  }

  open(server: Server, project_id: string) {
    return this.httpServer.post<Project>(server, `/projects/${project_id}/open`, {});
  }

  close(server: Server, project_id: string) {
    this.recentlyOpenedProjectService.removeData();
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

  update(server: Server, project: Project): Observable<Project> {
    return this.httpServer.put<Project>(server, `/projects/${project.project_id}`, {
      auto_close: project.auto_close,
      auto_open: project.auto_open,
      auto_start: project.auto_start,
      drawing_grid_size: project.drawing_grid_size,
      grid_size: project.grid_size,
      name: project.name,
      scene_width: project.scene_width,
      scene_height: project.scene_height,
      show_interface_labels: project.show_interface_labels,
    });
  }

  delete(server: Server, project_id: string): Observable<any> {
    return this.httpServer.delete(server, `/projects/${project_id}`);
  }

  getUploadPath(server: Server, uuid: string, project_name: string) {
    return `${server.protocol}//${server.host}:${server.port}/${environment.current_version}/projects/${uuid}/import?name=${project_name}`;
  }

  getExportPath(server: Server, project: Project) {
    return `${server.protocol}//${server.host}:${server.port}/${environment.current_version}/projects/${project.project_id}/export`;
  }

  export(server: Server, project_id: string): Observable<any> {
    return this.httpServer.get(server, `/projects/${project_id}/export`);
  }

  getStatistics(server: Server, project_id: string): Observable<any> {
    return this.httpServer.get(server, `/projects/${project_id}/stats`);
  }

  duplicate(server: Server, project_id: string, project_name): Observable<any> {
    return this.httpServer.post(server, `/projects/${project_id}/duplicate`, { name: project_name });
  }

  isReadOnly(project: Project) {
    if (project.readonly) {
      return project.readonly;
    }
    return false;
  }

  getCompression = () => {
    return this.compression_methods;
  };
  getCompressionLevel = () => {
    return this.compression_level_default_value;
  };
  exportPortableProject(server:Server,formData:any={}) {
    return this.httpServer.get(server,`projects/${formData.file_path}/export?include_snapshots=${formData.include_snapshots}&include_images=${formData.include_base_image}&reset_mac_addresses=${formData.reset_mac_address}&compression=${formData.compression}&compression_level=${formData.compression_level}`)
  }
}
