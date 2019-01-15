import { TestBed, inject } from '@angular/core/testing';

import { HttpClient } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { getTestServer } from './testing';
import { VersionService } from './version.service';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { Observable } from 'rxjs/Rx';

export class MockedVersionService {
  public response: Observable<any>;

  public get(server: Server) {
    return this.response;
  }
}

describe('VersionService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let service: VersionService;
  let server: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, VersionService]
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    service = TestBed.get(VersionService);
    server = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([VersionService], (service: VersionService) => {
    expect(service).toBeTruthy();
  }));

  it('should get version', inject([VersionService], (service: VersionService) => {
    service.get(server).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/version');
    expect(req.request.method).toEqual('GET');
  }));
});
