import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { IosImage } from '../models/images/ios-image';
import{ Controller } from '../models/controller';
import { IosTemplate } from '../models/templates/ios-template';
import { HttpController } from './http-controller.service';

@Injectable()
export class IosService {
  constructor(private httpServer: HttpController) {}

  getImages(controller:Controller ): Observable<any> {
    return this.httpServer.get<IosImage[]>(controller, '/images?image_type=ios') as Observable<IosImage[]>;
  }

  getImagePath(controller:Controller , filename: string): string {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/images/upload/${filename}`;
  }

  getTemplates(controller:Controller ): Observable<IosTemplate[]> {
    return this.httpServer.get<IosTemplate[]>(controller, '/templates') as Observable<IosTemplate[]>;
  }

  getTemplate(controller:Controller , template_id: string): Observable<IosTemplate> {
    return this.httpServer.get<IosTemplate>(controller, `/templates/${template_id}`) as Observable<IosTemplate>;
  }

  addTemplate(controller:Controller , iosTemplate: IosTemplate): Observable<IosTemplate> {
    return this.httpServer.post<IosTemplate>(controller, `/templates`, iosTemplate) as Observable<IosTemplate>;
  }

  saveTemplate(controller:Controller , iosTemplate: IosTemplate): Observable<IosTemplate> {
    return this.httpServer.put<IosTemplate>(
      controller,
      `/templates/${iosTemplate.template_id}`,
      iosTemplate
    ) as Observable<IosTemplate>;
  }
}
