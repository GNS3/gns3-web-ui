import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import { Server } from '../models/server';
import { Template } from '../models/template';
import { QemuTemplate } from '../models/templates/qemu-template';
import { HttpServer } from './http-server.service';

@Injectable()
export class TemplateService {
  constructor(private httpServer: HttpServer) {}

  list(server: Server): Observable<Template[]> {
    return this.httpServer.get<Template[]>(server, '/templates') as Observable<Template[]>;
  }

  deleteTemplate(server: Server, templateId: string): Observable<boolean> {
    return this.httpServer.delete(server, `/templates/${templateId}`, { observe: 'body' }).map(response => {
        return true;
    })
    .catch((response) => Observable.throw(false));
  }
}
