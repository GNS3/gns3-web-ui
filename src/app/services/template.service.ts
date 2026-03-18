import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import 'rxjs/add/operator/map';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { HttpController } from './http-controller.service';

@Injectable()
export class TemplateService {
  public newTemplateCreated: Subject<Template> = new Subject<Template>();

  constructor(private httpController: HttpController) {}

  list(controller: Controller ): Observable<Template[]> {
    return this.httpController.get<Template[]>(controller, '/templates') as Observable<Template[]>;
  }

  deleteTemplate(controller: Controller, templateId: string): Observable<any> {
    return this.httpController.delete(controller, `/templates/${templateId}`, { observe: 'body' });
  }
}
