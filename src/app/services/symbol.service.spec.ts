import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { environment } from 'environments/environment';
import { of } from 'rxjs';
import { Controller } from '@models/controller';
import { Symbol } from '@models/symbol';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpController } from './http-controller.service';
import { SymbolService } from './symbol.service';
import { getTestController } from './testing';

describe('SymbolService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpController: HttpController;
  let controller: Controller;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpController, SymbolService],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpController = TestBed.get(HttpController);
    controller = getTestController();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([SymbolService], (service: SymbolService) => {
    expect(service).toBeTruthy();
  }));

  it('should list symbols', inject([SymbolService], (service: SymbolService) => {
    service.list(controller).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/symbols`);
    expect(req.request.method).toEqual('GET');
  }));

  it('should get raw symbol', inject([SymbolService], (service: SymbolService) => {
    service.raw(controller, ':my/tested.png').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/symbols/:my/tested.png/raw`);
    expect(req.request.method).toEqual('GET');
  }));
});
