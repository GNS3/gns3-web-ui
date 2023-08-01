import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { SvgToDrawingConverter } from '../cartography/helpers/svg-to-drawing-converter';
import { Drawing } from '../cartography/models/drawing';
import { Project } from '../models/project';
import { Server } from '../models/server';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { DrawingService } from './drawing.service';
import { HttpServer } from './http-server.service';
import { getTestServer } from './testing';

describe('DrawingService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let server: Server;
  let project: Project = new Project();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, SvgToDrawingConverter, DrawingService],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    server = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([DrawingService], (service: DrawingService) => {
    expect(service).toBeTruthy();
  }));

  it('should updatePosition of drawing', inject([DrawingService], (service: DrawingService) => {
    const drawing = new Drawing();
    drawing.project_id = 'myproject';
    drawing.drawing_id = 'id';

    service.updatePosition(server, project, drawing, 10, 20).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/drawings/id');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      x: 10,
      y: 20,
    });
  }));

  it('should updatePosition of drawing and round to integer', inject([DrawingService], (service: DrawingService) => {
    const drawing = new Drawing();
    drawing.project_id = 'myproject';
    drawing.drawing_id = 'id';

    service.updatePosition(server, project, drawing, 10.1, 20.6).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/drawings/id');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      x: 10,
      y: 21,
    });
  }));

  it('should update size and position of drawing', inject([DrawingService], (service: DrawingService) => {
    const drawing = new Drawing();
    drawing.project_id = 'myproject';
    drawing.drawing_id = 'id';
    let svgSample = '<svg><test></svg>';

    service.updateSizeAndPosition(server, drawing, 100, 100, svgSample).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/drawings/id');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      x: 100,
      y: 100,
      svg: svgSample,
    });
  }));

  it('should update size and position of drawing and round to integer', inject(
    [DrawingService],
    (service: DrawingService) => {
      const drawing = new Drawing();
      drawing.project_id = 'myproject';
      drawing.drawing_id = 'id';
      let svgSample = '<svg><test></svg>';

      service.updateSizeAndPosition(server, drawing, 100.1, 100.6, svgSample).subscribe();

      const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/drawings/id');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual({
        x: 100,
        y: 101,
        svg: svgSample,
      });
    }
  ));

  it('should update drawing', inject([DrawingService], (service: DrawingService) => {
    const drawing = new Drawing();
    drawing.project_id = 'myproject';
    drawing.drawing_id = 'id';
    drawing.x = 10;
    drawing.y = 20;
    drawing.z = 30;
    drawing.rotation = 0;
    drawing.svg = '<svg></svg>';
    drawing.locked = false;

    service.update(server, drawing).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/drawings/id');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      x: 10,
      y: 20,
      z: 30,
      rotation: 0,
      svg: '<svg></svg>',
      locked: false,
    });
  }));

  it('should delete drawing', inject([DrawingService], (service: DrawingService) => {
    const drawing = new Drawing();
    drawing.project_id = 'myproject';
    drawing.drawing_id = 'id';

    service.delete(server, drawing).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/drawings/id');
    expect(req.request.method).toEqual('DELETE');
  }));

  it('should duplicate drawing', inject([DrawingService], (service: DrawingService) => {
    const drawing = new Drawing();
    drawing.project_id = 'project_id_1';
    drawing.drawing_id = 'drawing_id_1';
    drawing.x = 100;
    drawing.y = 90;
    drawing.z = 1;
    drawing.rotation = 0;
    drawing.svg =
      '<svg height="100" width="200"><rect fill="#ffffff" fill-opacity="1.0" height="100" stroke="#000000" stroke-width="2" width="200" rx="0" ry="0" /></svg>';

    service.duplicate(server, drawing.project_id, drawing).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/v2/projects/${drawing.project_id}/drawings`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      svg: drawing.svg,
      rotation: 0,
      x: 110,
      y: 100,
      z: 1,
    });
  }));
});
