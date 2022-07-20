import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { environment } from 'environments/environment';
import { Server } from '../models/server';
import { Snapshot } from '../models/snapshot';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpServer } from './http-server.service';
import { SnapshotService } from './snapshot.service';
import { getTestServer } from './testing';

describe('SnapshotService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpServer;
  let service: SnapshotService;
  let controller: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer, HttpClient,SnapshotService],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpServer);
    service = TestBed.get(SnapshotService);
    controller = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([SnapshotService], (service: SnapshotService) => {
    expect(service).toBeTruthy();
  }));

  it('should create snapshot', inject([SnapshotService], (service: SnapshotService) => {
    const snapshot = new Snapshot();
    service.create(controller, 'myproject', snapshot).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/snapshots`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(snapshot);
  }));

  it('should list snapshots', inject([SnapshotService], (service: SnapshotService) => {
    service.list(controller, 'myproject').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/projects/myproject/snapshots`);
    expect(req.request.method).toEqual('GET');
  }));
});
