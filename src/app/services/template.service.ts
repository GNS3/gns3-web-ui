import { Injectable } from '@angular/core';

import 'rxjs/add/operator/map';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { Template } from '../models/template';
import { Observable } from 'rxjs';

@Injectable()
export class TemplateService {
  constructor(private httpServer: HttpServer) {}

  list(server: Server): Observable<Template[]> {
    return this.httpServer.get<Template[]>(server, '/templates') as Observable<Template[]>;
  }
}
