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

  list(controller: Server): Observable<Template[]> {
    return this.httpServer.get<Template[]>(controller, '/templates') as Observable<Template[]>;
  }

  deleteTemplate(controller: Server, templateId: string): Observable<any> {
    return this.httpServer.delete(controller, `/templates/${templateId}`, { observe: 'body' });
  }
}
