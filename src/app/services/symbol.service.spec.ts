import { TestBed, inject } from '@angular/core/testing';

import { HttpClient } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { getTestServer } from './testing';
import { SymbolService } from './symbol.service';
import { Symbol } from '../models/symbol';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';

describe('SymbolService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let server: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, SymbolService]
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

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/symbols');
    expect(req.request.method).toEqual('GET');
  }));

  it('should get raw symbol', inject([SymbolService], (service: SymbolService) => {
    service.raw(server, ':my/tested.png').subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/symbols/:my/tested.png/raw');
    expect(req.request.method).toEqual('GET');
  }));

  it('should load symbols', inject([SymbolService], (service: SymbolService) => {
    service.load(server).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/symbols');

    req.flush([{ symbol_id: 'myid' }]);

    const raw = httpTestingController.expectOne('http://127.0.0.1:3080/v2/symbols/myid/raw');
    raw.flush('myraw');

    service.symbols.subscribe(symbols => {
      expect(symbols.length).toEqual(1);
      expect(symbols[0].symbol_id).toEqual('myid');
      expect(symbols[0].raw).toEqual('myraw');
    });
  }));

  it('should get symbols', inject([SymbolService], (service: SymbolService) => {
    const symbol = new Symbol();
    symbol.symbol_id = 'myid';
    service.symbols.next([symbol]);

    expect(service.get('myid').symbol_id).toEqual('myid');
  }));
});
