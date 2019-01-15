import { Injectable } from '@angular/core';

import 'rxjs/add/operator/map';

import { Version } from '../models/version';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';

@Injectable()
export class VersionService {
  constructor(private httpServer: HttpServer) {}

  get(server: Server) {
    return this.httpServer.get<Version>(server, '/version');
  }
}
