import { TestBed, inject } from '@angular/core/testing';

import { HttpClient } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { Node } from '../../cartography/shared/models/node';
import { Port } from '../models/port';
import { getTestServer } from './testing';
import { Appliance } from '../models/appliance';
import { Project } from '../models/project';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let service: ProjectService;
  let server: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        HttpServer,
        ProjectService
      ]
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    service = TestBed.get(ProjectService);
    server = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([ProjectService], (service: ProjectService) => {
    expect(service).toBeTruthy();
  }));

  it('should get the project', inject([ProjectService], (service: ProjectService) => {
    service.get(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject');
    expect(req.request.method).toEqual("GET");
  }));

  it('should open the project', inject([ProjectService], (service: ProjectService) => {
    service.open(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/open');
    expect(req.request.method).toEqual("POST");
    expect(req.request.body).toEqual({});
  }));

  it('should list projects', inject([ProjectService], (service: ProjectService) => {
    service.list(server).subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects');
    expect(req.request.method).toEqual("GET");
  }));

  it('should get nodes of project', inject([ProjectService], (service: ProjectService) => {
    service.nodes(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/nodes');
    expect(req.request.method).toEqual("GET");
  }));

  it('should get links of project', inject([ProjectService], (service: ProjectService) => {
    service.links(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/links');
    expect(req.request.method).toEqual("GET");
  }));

  it('should get drawings of project', inject([ProjectService], (service: ProjectService) => {
    service.drawings(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/drawings');
    expect(req.request.method).toEqual("GET");
  }));

  it('should delete the project', inject([ProjectService], (service: ProjectService) => {
    service.delete(server, "myproject").subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject');
    expect(req.request.method).toEqual("DELETE");
  }));

  it('should get notifications path of project', inject([ProjectService], (service: ProjectService) => {
    const path = service.notificationsPath(server, "myproject");
    expect(path).toEqual('ws://127.0.0.1:3080/v2/projects/myproject/notifications/ws')
  }));
});
