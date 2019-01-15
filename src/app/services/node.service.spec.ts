import { TestBed, inject } from '@angular/core/testing';

import { HttpClient } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { Node } from '../cartography/models/node';
import { getTestServer } from './testing';
import { NodeService } from './node.service';
import { Template } from '../models/template';
import { Project } from '../models/project';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { Label } from '../cartography/models/label';

describe('NodeService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let service: NodeService;
  let server: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, NodeService]
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    service = TestBed.get(NodeService);
    server = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([NodeService], (service: NodeService) => {
    expect(service).toBeTruthy();
  }));

  it('should start node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    service.start(server, node).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/nodes/id/start');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  }));

  it('should stop node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    service.stop(server, node).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/nodes/id/stop');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  }));

  it('should createFromTemplate node', inject([NodeService], (service: NodeService) => {
    const project = new Project();
    project.project_id = 'myproject';
    const template = new Template();
    template.template_id = 'mytemplate';

    service.createFromTemplate(server, project, template, 10, 20, 'compute').subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/templates/mytemplate');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      x: 10,
      y: 20,
      compute_id: 'compute'
    });
  }));

  it('should updatePosition of node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    service.updatePosition(server, node, 10, 20).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/nodes/id');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      x: 10,
      y: 20
    });
  }));

  it('should updatePosition of node and round to integer', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    service.updatePosition(server, node, 10.1, 20.6).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/nodes/id');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      x: 10,
      y: 21
    });
  }));

  it('should update label of node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    const label = new Label();
    label.rotation = 10;
    label.style = 'my style';
    label.text = 'my text';
    label.x = 10;
    label.y = 20;

    service.updateLabel(server, node, label).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/nodes/id');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      label: {
        rotation: 10,
        style: 'my style',
        text: 'my text',
        x: 10,
        y: 20
      }
    });
  }));

  it('should update node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';
    node.x = 10;
    node.y = 20;
    node.z = 30;

    service.update(server, node).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/nodes/id');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      x: 10,
      y: 20,
      z: 30
    });
  }));

  it('should delete node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    service.delete(server, node).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/nodes/id');
    expect(req.request.method).toEqual('DELETE');
  }));
});
