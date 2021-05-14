import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Server } from '../models/server';
import { Symbol } from '../models/symbol';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpServer } from './http-server.service';
import { SymbolService } from './symbol.service';
import { getTestServer } from './testing';

describe('SymbolService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let server: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, SymbolService],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    server = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([SymbolService], (service: SymbolService) => {
    expect(service).toBeTruthy();
  }));

  it('should list symbols', inject([SymbolService], (service: SymbolService) => {
    service.list(server).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v3/symbols');
    expect(req.request.method).toEqual('GET');
  }));

  it('should get raw symbol', inject([SymbolService], (service: SymbolService) => {
    service.raw(server, ':my/tested.png').subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v3/symbols/:my/tested.png/raw');
    expect(req.request.method).toEqual('GET');
  }));

  it('should call load symbols while adding symbol', inject([SymbolService], (service: SymbolService) => {
    spyOn(service, 'load');

    service.add(server, 'symbolName', 'symbol');

    expect(service.load).toHaveBeenCalled();
  }));
});
