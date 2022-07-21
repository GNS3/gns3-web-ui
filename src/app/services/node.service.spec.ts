import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { environment } from 'environments/environment';
import { Label } from '../cartography/models/label';
import { Node } from '../cartography/models/node';
import { Project } from '../models/project';
import{ Controller } from '../models/controller';
import { Template } from '../models/template';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpController } from './http-controller.service';
import { NodeService } from './node.service';
import { getTestServer } from './testing';

describe('NodeService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpController;
  let service: NodeService;
  let controller:Controller ;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [
        HttpController,
        NodeService,
      ],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpController);
    service = TestBed.get(NodeService);
    controller = getTestServer();
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

    service.start(controller, node).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/nodes/id/start`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  }));

  it('should stop node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    service.stop(controller, node).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/nodes/id/stop`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  }));

  it('should suspend node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    service.suspend(controller, node).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/nodes/id/suspend`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  }));

  it('should reload node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    service.reload(controller, node).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/nodes/id/reload`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  }));

  it('should start all nodes', inject([NodeService], (service: NodeService) => {
    let project = {
      project_id: '1',
    } as Project;

    service.startAll(controller, project).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/1/nodes/start`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  }));

  it('should stop all nodes', inject([NodeService], (service: NodeService) => {
    let project = {
      project_id: '1',
    } as Project;

    service.stopAll(controller, project).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/1/nodes/stop`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  }));

  it('should suspend all nodes', inject([NodeService], (service: NodeService) => {
    let project = {
      project_id: '1',
    } as Project;

    service.suspendAll(controller, project).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/1/nodes/suspend`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  }));

  it('should reload all nodes', inject([NodeService], (service: NodeService) => {
    let project = {
      project_id: '1',
    } as Project;

    service.reloadAll(controller, project).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/1/nodes/reload`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
  }));

  it('should createFromTemplate node', inject([NodeService], (service: NodeService) => {
    const project = new Project();
    project.project_id = 'myproject';
    const template = new Template();
    template.template_id = 'mytemplate';

    service.createFromTemplate(controller, project, template, 10, 20, 'compute').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/templates/mytemplate`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      x: 10,
      y: 20,
      compute_id: 'compute',
    });
  }));

  it('should updatePosition of node', inject([NodeService], (service: NodeService) => {
    let project = {
      project_id: '1',
    } as Project;
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    service.updatePosition(controller, project, node, 10, 20).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/nodes/id`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      x: 10,
      y: 20,
    });
  }));

  it('should updatePosition of node and round to integer', inject([NodeService], (service: NodeService) => {
    let project = {
      project_id: '1',
    } as Project;
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    service.updatePosition(controller, project, node, 10.1, 20.6).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/nodes/id`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      x: 10,
      y: 21,
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

    service.updateLabel(controller, node, label).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/nodes/id`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      label: {
        rotation: 10,
        style: 'my style',
        text: 'my text',
        x: 10,
        y: 20,
      },
    });
  }));

  it('should update node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';
    node.x = 10;
    node.y = 20;
    node.z = 30;

    service.update(controller, node).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/nodes/id`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      x: 10,
      y: 20,
      z: 30,
    });
  }));

  it('should delete node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'myproject';
    node.node_id = 'id';

    service.delete(controller, node).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/nodes/id`);
    expect(req.request.method).toEqual('DELETE');
  }));

  it('should duplicate node', inject([NodeService], (service: NodeService) => {
    const node = new Node();
    node.project_id = 'project_id_1';
    node.node_id = 'node_id_1';

    service.duplicate(controller, node).subscribe();

    const req = httpTestingController.expectOne(
      `http://127.0.0.1:3080/${environment.current_version}/projects/${node.project_id}/nodes/${node.node_id}/duplicate`
    );
    expect(req.request.method).toEqual('POST');
  }));
});
