import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import 'rxjs/add/operator/map';
import { Server } from '../models/server';
import { Template } from '../models/template';
import { HttpServer } from './http-server.service';

@Injectable()
export class TemplateService {
  public newTemplateCreated: Subject<Template> = new Subject<Template>();

  constructor(private httpServer: HttpServer) {}

  list(server: Server): Observable<Template[]> {
    return this.httpServer.get<Template[]>(server, '/templates') as Observable<Template[]>;
  }

  deleteTemplate(server: Server, templateId: string): Observable<any> {
    return this.httpServer.delete(server, `/templates/${templateId}`, { observe: 'body' });
  }
}
