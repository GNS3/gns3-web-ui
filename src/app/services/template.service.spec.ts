import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'environments/environment';
import{ Controller } from '../models/controller';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpController } from './http-controller.service';
import { TemplateService } from './template.service';

describe('TemplateService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let service: TemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [TemplateService, HttpController, HttpClient],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    service = TestBed.get(TemplateService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should ask for the list from controller', () => {
    const controller = new Controller  ();
    controller.host = '127.0.0.1';
    controller.port = 3080;

    service.list(controller).subscribe(() => {});

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/templates`);
    expect(req.request.url).toBe(`http://127.0.0.1:3080/${environment.current_version}/templates`);
  });
});
