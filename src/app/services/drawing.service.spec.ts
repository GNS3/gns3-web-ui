import { TestBed, inject } from '@angular/core/testing';

import { HttpClient } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { Drawing } from '../cartography/models/drawing';
import { getTestServer } from './testing';
import { DrawingService } from './drawing.service';
import { AppTestingModule } from "../testing/app-testing/app-testing.module";


describe('DrawingService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let server: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        AppTestingModule
      ],
      providers: [
        HttpServer,
        DrawingService
      ]
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
    drawing.project_id = "myproject";
    drawing.drawing_id = "id";

    service.updatePosition(server, drawing, 10, 20).subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/drawings/id');
    expect(req.request.method).toEqual("PUT");
    expect(req.request.body).toEqual({
      'x': 10,
      'y': 20
    });
  }));

  it('should update drawing', inject([DrawingService], (service: DrawingService) => {
    const drawing = new Drawing();
    drawing.project_id = "myproject";
    drawing.drawing_id = "id";
    drawing.x = 10;
    drawing.y = 20;
    drawing.z = 30;

    service.update(server, drawing).subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/drawings/id');
    expect(req.request.method).toEqual("PUT");
    expect(req.request.body).toEqual({
      'x': 10,
      'y': 20,
      'z': 30
    });
  }));

  it('should delete drawing', inject([DrawingService], (service: DrawingService) => {
    const drawing = new Drawing();
    drawing.project_id = "myproject";
    drawing.drawing_id = "id";

    service.delete(server, drawing).subscribe();

    const req = httpTestingController.expectOne(
      'http://127.0.0.1:3080/v2/projects/myproject/drawings/id');
    expect(req.request.method).toEqual("DELETE");
  }));

});
