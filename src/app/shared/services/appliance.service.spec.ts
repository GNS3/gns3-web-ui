import { TestBed, inject, async } from '@angular/core/testing';
import { HttpClientModule} from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ApplianceService } from './appliance.service';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { Http, HttpModule, XHRBackend} from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';

describe('ApplianceService', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpModule,
      ],
      providers: [
        ApplianceService,
        HttpServer,
        MockBackend,
        { provide: XHRBackend, useExisting: MockBackend }
      ]
    });
  }));

  it('should be created', 
    inject([ApplianceService, Http, MockBackend], 
      (service: ApplianceService, client: Http, backend: MockBackend) => {

    expect(service).toBeTruthy();
  }));

  it('should ask for the list from server', 
    async(inject([ApplianceService, Http, MockBackend], 
      (service: ApplianceService, client: Http, backend: MockBackend) => {
    
    const server = new Server();
    server.ip = "127.0.0.1";
    server.port = 3080;
    server.authorization = "none";

    service.list(server).subscribe();

    backend.connections.subscribe((c: MockConnection) => {
      expect(c.request.url).toBe('test');
    });

    expect(backend.verifyNoPendingRequests).toBeTruthy();
  })));
});
