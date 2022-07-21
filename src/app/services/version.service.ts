import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import{ Controller } from '../models/controller';
import { Version } from '../models/version';
import { HttpServer } from './http-server.service';

@Injectable()
export class VersionService {
  constructor(private httpServer: HttpServer) {}

  get(controller:Controller ) {
    return this.httpServer.get<Version>(controller, '/version');
  }
}
