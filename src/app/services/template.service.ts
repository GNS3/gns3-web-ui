import { Injectable } from '@angular/core';

import 'rxjs/add/operator/map';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { Template } from '../models/template';
import { Observable, Subject } from 'rxjs';
import { QemuTemplate } from '../models/templates/qemu-template';

@Injectable()
export class TemplateService {
  public newTemplateCreated: Subject<Template> = new Subject<Template>();

  constructor(private httpServer: HttpServer) {}

  list(server: Server): Observable<Template[]> {
    return this.httpServer.get<Template[]>(server, '/templates') as Observable<Template[]>;
  }

  deleteTemplate(server: Server, templateId: string): Observable<boolean> {
    return this.httpServer.delete(server, `/templates/${templateId}`, { observe: 'body' }).map(response => {
        return true;
    })
    .catch((response) => { return Observable.throw(false)});
  }
}
