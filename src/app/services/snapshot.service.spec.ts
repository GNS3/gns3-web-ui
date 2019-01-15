import { TestBed, inject } from '@angular/core/testing';

import { HttpClient } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { getTestServer } from './testing';
import { SnapshotService } from './snapshot.service';
import { Snapshot } from '../models/snapshot';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';

describe('SnapshotService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let service: SnapshotService;
  let server: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, SnapshotService]
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    service = TestBed.get(SnapshotService);
    server = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([SnapshotService], (service: SnapshotService) => {
    expect(service).toBeTruthy();
  }));

  it('should create snapshot', inject([SnapshotService], (service: SnapshotService) => {
    const snapshot = new Snapshot();
    service.create(server, 'myproject', snapshot).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/snapshots');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(snapshot);
  }));

  it('should list snapshots', inject([SnapshotService], (service: SnapshotService) => {
    service.list(server, 'myproject').subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/projects/myproject/snapshots');
    expect(req.request.method).toEqual('GET');
  }));
});
