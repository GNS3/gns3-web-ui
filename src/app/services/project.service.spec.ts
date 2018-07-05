import { TestBed, inject } from '@angular/core/testing';

import { HttpClient } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { getTestServer } from './testing';
import { ProjectService } from './project.service';
import { SettingsService } from "./settings.service";
import { MockedSettingsService } from "./settings.service.spec";
import { Observable } from "rxjs/Observable";
import { Project } from "../models/project";
import { AppTestingModule } from "../testing/app-testing/app-testing.module";


/**
 * Mocks ProjectsService so it's not based on settings
 */
export class MockedProjectService {

  public projects: Project[] = [];

  list(server: Server) {
    return Observable.of(this.projects);
  }

  open(server: Server, project: Project) {
    return Observable.of(project);
  }

  close(server: Server, project: Project) {
    return Observable.of(project);
  }

  isReadOnly(project) {
    return project.readonly;
  }
}


describe('ProjectService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let service: ProjectService;
  let server: Server;
  let settingsService: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        AppTestingModule
      ],
      providers: [
        HttpServer,
        ProjectService,
        { provide: SettingsService, useClass: MockedSettingsService }
      ]
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    service = TestBed.get(ProjectService);
    settingsService = TestBed.get(SettingsService);

    server = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get the project',  () => {
    service.get(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject');
    expect(req.request.method).toEqual("GET");
  });

  it('should open the project', () => {
    service.open(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/open');
    expect(req.request.method).toEqual("POST");
    expect(req.request.body).toEqual({});
  });

  it('should close the project', () => {
    service.close(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/close');
    expect(req.request.method).toEqual("POST");
    expect(req.request.body).toEqual({});
  });


  it('should list projects', () => {
    service.list(server).subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects');
    expect(req.request.method).toEqual("GET");
  });

  it('should get nodes of project',  () => {
    service.nodes(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/nodes');
    expect(req.request.method).toEqual("GET");
  });

  it('should get links of project', () => {
    service.links(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/links');
    expect(req.request.method).toEqual("GET");
  });

  it('should get drawings of project', () => {
    service.drawings(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/drawings');
    expect(req.request.method).toEqual("GET");
  });

  it('should delete the project', () => {
    service.delete(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject');
    expect(req.request.method).toEqual("DELETE");
  });

  it('should get notifications path of project', () => {
    const path = service.notificationsPath(server, "myproject");
    expect(path).toEqual('ws://127.0.0.1:3080/v2/projects/myproject/notifications/ws');
  });

  it('project should be readonly when defined as readonly ', () => {
    const project = new Project();
    project.readonly = true;

    expect(service.isReadOnly(project)).toEqual(true);
  });

  it('project should be readonly when experimentalFeatures disabled ', () => {
    const project = new Project();
    project.readonly = false;
    spyOn(settingsService, 'isExperimentalEnabled').and.returnValue(false);

    expect(service.isReadOnly(project)).toEqual(true);
  });

  it('project should not be readonly when experimentalFeatures enabled ', () => {
    const project = new Project();
    project.readonly = false;
    spyOn(settingsService, 'isExperimentalEnabled').and.returnValue(true);

    expect(service.isReadOnly(project)).toEqual(false);
  });
});
