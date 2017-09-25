import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';

import { Version} from '../models/version';
import { HttpServer } from "./http-server.service";
import { Server } from "../models/server";


@Injectable()
export class VersionService {

  constructor(private httpServer: HttpServer) { }

  get(server: Server): Observable<Version> {
    return this.httpServer
                .get(server, '/version')
                .map(response => response.json() as Version);
  }
}
