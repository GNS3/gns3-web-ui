import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable, Subject } from 'rxjs';
import { Drawing } from '../cartography/models/drawing';
import { Node } from '../cartography/models/node';
import { Link } from '../models/link';
import { Project } from '../models/project';
import { Controller } from '../models/controller';
import { HttpController } from './http-controller.service';
import { RecentlyOpenedProjectService } from './recentlyOpenedProject.service';
import { SettingsService } from './settings.service';

@Injectable()
export class ProjectService {
  compression_methods: any = [
    { id: 1, value: 'none', name: 'None' },
    { id: 2, value: 'zip', name: 'Zip compression (deflate)' },
    { id: 3, value: 'bzip2', name: 'Bzip2 compression' },
    { id: 4, value: 'lzma', name: 'Lzma compression' },
    { id: 5, value: 'zstd', name: 'Zstandard compression' },
  ];
  compression_level_default_value: any = [
    { id: 1, name: 'none', value: '', selectionValues: [] },
    { id: 2, name: 'zip', value: 6, selectionValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { id: 3, name: 'bzip2', value: 9, selectionValues: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { id: 4, name: 'lzma', value: ' ', selectionValues: [] },
    {
      id: 5,
      name: 'zstd',
      value: 3,
      selectionValues: [1, 2, 3, 4, 5, 6, 7, 8, 9.1, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    },
  ];

  public projectListSubject = new Subject<boolean>();
  public projectLockIconSubject = new Subject<boolean>();
  constructor(
    private httpController: HttpController,
    private settingsService: SettingsService,
    private recentlyOpenedProjectService: RecentlyOpenedProjectService
  ) {}

  projectListUpdated() {
    this.projectListSubject.next(true);
  }

  getReadmeFile(controller: Controller, project_id: string) {
    return this.httpController.getText(controller, `/projects/${project_id}/files/README.txt`);
  }

  postReadmeFile(controller: Controller, project_id: string, readme: string) {
    return this.httpController.post<any>(controller, `/projects/${project_id}/files/README.txt`, readme);
  }

  get(controller: Controller, project_id: string) {
    return this.httpController.get<Project>(controller, `/projects/${project_id}`);
  }

  open(controller: Controller, project_id: string) {
    return this.httpController.post<Project>(controller, `/projects/${project_id}/open`, {});
  }

  close(controller: Controller, project_id: string) {
    this.recentlyOpenedProjectService.removeData();
    return this.httpController.post<Project>(controller, `/projects/${project_id}/close`, {});
  }

  list(controller: Controller ) {
    return this.httpController.get<Project[]>(controller, '/projects');
  }

  nodes(controller: Controller, project_id: string) {
    return this.httpController.get<Node[]>(controller, `/projects/${project_id}/nodes`);
  }

  links(controller: Controller, project_id: string) {
    return this.httpController.get<Link[]>(controller, `/projects/${project_id}/links`);
  }

  drawings(controller: Controller, project_id: string) {
    return this.httpController.get<Drawing[]>(controller, `/projects/${project_id}/drawings`);
  }

  add(controller: Controller, project_name: string, project_id: string): Observable<any> {
    return this.httpController.post<Project>(controller, `/projects`, { name: project_name, project_id: project_id });
  }

  update(controller: Controller, project: Project): Observable<Project> {
    return this.httpController.put<Project>(controller, `/projects/${project.project_id}`, {
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

  delete(controller: Controller, project_id: string): Observable<any> {
    return this.httpController.delete(controller, `/projects/${project_id}`);
  }

  getUploadPath(controller: Controller, uuid: string, project_name: string) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/projects/${uuid}/import?name=${project_name}`;
  }

  getExportPath(controller: Controller, project: Project) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/projects/${project.project_id}/export`;
  }

  export(controller: Controller, project_id: string): Observable<any> {
    return this.httpController.get(controller, `/projects/${project_id}/export`);
  }

  getStatistics(controller: Controller, project_id: string): Observable<any> {
    return this.httpController.get(controller, `/projects/${project_id}/stats`);
  }

  duplicate(controller: Controller, project_id: string, project_name): Observable<any> {
    return this.httpController.post(controller, `/projects/${project_id}/duplicate`, { name: project_name });
  }

  isReadOnly(project: Project) {
    if (project.readonly) {
      return project.readonly;
    }
    return false;
  }

  getCompression() {
    return this.compression_methods;
  };
  getCompressionLevel() {
    return this.compression_level_default_value;
  };


  getexportPortableProjectPath(controller : Controller, project_id: string,formData:any={}) {
    if (formData.compression_level != null && formData.compression_level !='') {
      return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/projects/${project_id}/export?include_snapshots=${formData.include_snapshots}&include_images=${formData.include_base_image}&reset_mac_addresses=${formData.reset_mac_address}&compression=${formData.compression}&compression_level=${formData.compression_level}&token=${controller.authToken}`;
    } else {
      return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/projects/${project_id}/export?include_snapshots=${formData.include_snapshots}&include_images=${formData.include_base_image}&reset_mac_addresses=${formData.reset_mac_address}&compression=${formData.compression}&token=${controller.authToken}`;

    }
  }

getProjectStatus(controller : Controller, project_id: string): Observable<any> {
  return this.get(controller,`${project_id}/locked`)
}


  projectUpdateLockIcon(){
    this.projectLockIconSubject.next(true)
  }
}
