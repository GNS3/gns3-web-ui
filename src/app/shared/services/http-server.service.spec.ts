import { TestBed, inject } from '@angular/core/testing';

import { HttpServer } from './http-server.service';

describe('HttpServer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpServer]
    });
  });

  // it('should be created', inject([HttpServer], (service: HttpServer) => {
  //   expect(service).toBeTruthy();
  // }));
});
