import { TestBed, inject } from '@angular/core/testing';

import { ServerService } from './server.service';
import { Server } from "../models/server";

export class MockedServerService {
  public getLocalServer(hostname: string, port: number) {
    return new Promise((resolve, reject) => {
      const server = new Server();
      server.id = 99;
      resolve(server);
    });
  }
}

describe('ServerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ ServerService ]
    });
  });

  // it('should be created', inject([ServerService], (service: ServerService) => {
  //   expect(service).toBeTruthy();
  // }));
});
