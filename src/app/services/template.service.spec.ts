import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Server } from '../models/server';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpServer } from './http-server.service';
import { TemplateService } from './template.service';

describe('TemplateService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let service: TemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [TemplateService, HttpServer, HttpClient],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    service = TestBed.get(TemplateService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should ask for the list from server', () => {
    const server = new Server();
    server.host = '127.0.0.1';
    server.port = 3080;

    service.list(server).subscribe(() => {});

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v3/templates');
    expect(req.request.url).toBe('http://127.0.0.1:3080/v3/templates');
  });
});
