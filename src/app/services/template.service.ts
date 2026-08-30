import { Injectable } from '@angular/core';
import { Observable, Subject, switchMap } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { HttpController } from './http-controller.service';

@Injectable()
export class TemplateService {
  public newTemplateCreated: Subject<Template> = new Subject<Template>();

  constructor(private httpController: HttpController) {}

  list(controller: Controller): Observable<Template[]> {
    return this.httpController.get<Template[]>(controller, '/templates') as Observable<Template[]>;
  }

  deleteTemplate(controller: Controller, templateId: string): Observable<any> {
    return this.httpController.delete(controller, `/templates/${templateId}`, { observe: 'body' });
  }

  /**
   * Duplicates a template of any type: fetches the source template, assigns a
   * fresh id and name, and creates the copy. The /templates endpoints are
   * type-agnostic, so no per-emulator service dispatch is needed.
   */
  duplicate(controller: Controller, templateId: string, newName: string): Observable<Template> {
    return this.httpController.get<Template>(controller, `/templates/${templateId}`).pipe(
      switchMap((template) =>
        this.httpController.post<Template>(controller, '/templates', {
          ...template,
          template_id: uuid(),
          name: newName,
        })
      )
    );
  }
}
