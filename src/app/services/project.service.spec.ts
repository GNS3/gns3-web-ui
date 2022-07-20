import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'environments/environment';
import { of } from 'rxjs';
import { Project } from '../models/project';
import { Server } from '../models/server';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpServer } from './http-server.service';
import { ProjectService } from './project.service';
import { RecentlyOpenedProjectService } from './recentlyOpenedProject.service';
import { SettingsService } from './settings.service';
import { getTestServer } from './testing';

/**
 * Mocks ProjectsService so it's not based on settings
 */
export class MockedProjectService {
  public projects: Project[] = [];

  list(controller: Server) {
    return of(this.projects);
  }

  open(controller: Server, project: Project) {
    return of(project);
  }

  close(controller: Server, project: Project) {
    return of(project);
  }

  isReadOnly(project) {
    return project.readonly;
  }

  links(controller: Server, project_id: string) {
    return of([]);
  }

  delete(controller: Server, project_id: string) {
    return of(project_id);
  }

  duplicate(controller: Server, project_id: string) {
    return of(project_id);
  }

  getStatistics(controller: Server, project_id: string) {
    return of({});
  }
  exportPortableProject(controller: Server, formData:{}) {
    return of({});
  }
  getCompression() {
    return of([]);
  }
  getCompressionLevel() {
    return of([]);
  }
}

describe('ProjectService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let service: ProjectService;
  let controller: Server;
  let settingsService: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [
        HttpServer,
        ProjectService,
        RecentlyOpenedProjectService,
        { provide: SettingsService },
      ],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    service = TestBed.get(ProjectService);
    settingsService = TestBed.get(SettingsService);

    controller = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get the project', () => {
    service.get(controller, 'myproject').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject`);
    expect(req.request.method).toEqual('GET');
  });

  it('should open the project', () => {
    service.open(controller, 'myproject').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/open`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  });

  it('should close the project', () => {
    service.close(controller, 'myproject').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/close`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  });

  it('should list projects', () => {
    service.list(controller).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects`);
    expect(req.request.method).toEqual('GET');
  });

  it('should get nodes of project', () => {
    service.nodes(controller, 'myproject').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/nodes`);
    expect(req.request.method).toEqual('GET');
  });

  it('should get links of project', () => {
    service.links(controller, 'myproject').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/links`);
    expect(req.request.method).toEqual('GET');
  });

  it('should get drawings of project', () => {
    service.drawings(controller, 'myproject').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/drawings`);
    expect(req.request.method).toEqual('GET');
  });

  it('should delete the project', () => {
    service.delete(controller, 'myproject').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject`);
    expect(req.request.method).toEqual('DELETE');
  });

  it('should duplicate the project', () => {
    service.duplicate(controller, 'projectId', 'projectName').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/projectId/duplicate`);
    expect(req.request.method).toEqual('POST');
  });

  it('project should be readonly when defined as readonly ', () => {
    const project = new Project();
    project.readonly = true;

    expect(service.isReadOnly(project)).toEqual(true);
  });
});
