import { TestBed, inject } from '@angular/core/testing';

import { SnapshotService } from './snapshot.service';
import { HttpServer } from './http-server.service';

class MockedHttpServer {
  post(server: any, url: string, data: any) {}

  get(server: any, url: string, data: any) {}
}

describe('SnapshotService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SnapshotService,
        {provide: HttpServer, useClass: MockedHttpServer}
      ],

    });
  });

  it('should be created', inject([SnapshotService], (service: SnapshotService) => {
    expect(service).toBeTruthy();
  }));
});
