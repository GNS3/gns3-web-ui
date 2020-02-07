import { Injectable } from '@angular/core';

import 'rxjs/add/operator/map';

import { Server } from '../models/server';
import { Version } from '../models/version';
import { HttpServer } from './http-server.service';

@Injectable()
export class VersionService {
  constructor(private httpServer: HttpServer) {}

  get(server: Server) {
    return this.httpServer.get<Version>(server, '/version');
  }
}
