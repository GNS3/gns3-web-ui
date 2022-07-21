import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { environment } from 'environments/environment';
import { Node } from '../cartography/models/node';
import { Port } from '../models/port';
import{ Controller } from '../models/controller';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpController } from './http-controller.service';
import { LinkService } from './link.service';
import { getTestServer } from './testing';

describe('LinkService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpController;
  let controller:Controller ;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpController, LinkService],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpController);
    controller = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([LinkService], (service: LinkService) => {
    expect(service).toBeTruthy();
  }));

  it('should create link', inject([LinkService], (service: LinkService) => {
    const sourceNode = new Node();
    sourceNode.project_id = 'myproject';
    sourceNode.node_id = 'sourceid';

    const sourcePort = new Port();
    sourcePort.port_number = 1;
    sourcePort.adapter_number = 2;

    const targetNode = new Node();
    targetNode.node_id = 'targetid';

    const targetPort = new Port();
    targetPort.port_number = 3;
    targetPort.adapter_number = 4;

    service.createLink(controller, sourceNode, sourcePort, targetNode, targetPort, 0, 0, 10, 10).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/links`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      nodes: [
        {
          node_id: 'sourceid',
          port_number: 1,
          adapter_number: 2,
          label: {
            rotation: 0,
            style: 'font-size: 10; font-style: Verdana',
            text: sourcePort.short_name,
            x: 0,
            y: 0,
          },
        },
        {
          node_id: 'targetid',
          port_number: 3,
          adapter_number: 4,
          label: {
            rotation: 0,
            style: 'font-size: 10; font-style: Verdana',
            text: sourcePort.short_name,
            x: 10,
            y: 10,
          },
        },
      ],
    });
  }));
});
