import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { IouImage } from '../models/iou/iou-image';
import{ Controller } from '../models/controller';
import { IouTemplate } from '../models/templates/iou-template';
import { HttpServer } from './http-server.service';

@Injectable()
export class IouService {
  constructor(private httpServer: HttpServer) {}

  getTemplates(controller:Controller ): Observable<IouTemplate[]> {
    return this.httpServer.get<IouTemplate[]>(controller, '/templates') as Observable<IouTemplate[]>;
  }

  getTemplate(controller:Controller , template_id: string): Observable<any> {
    return this.httpServer.get<IouTemplate>(controller, `/templates/${template_id}`) as Observable<IouTemplate>;
  }

  getImages(controller:Controller ): Observable<any> {
    return this.httpServer.get<IouImage[]>(controller, '/images?image_type=iou') as Observable<IouImage[]>;
  }

  getImagePath(controller:Controller , filename: string): string {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/images/upload/${filename}`;
  }

  addTemplate(controller:Controller , iouTemplate: any): Observable<any> {
    return this.httpServer.post<IouTemplate>(controller, `/templates`, iouTemplate) as Observable<IouTemplate>;
  }

  saveTemplate(controller:Controller , iouTemplate: any): Observable<any> {
    return this.httpServer.put<IouTemplate>(
      controller,
      `/templates/${iouTemplate.template_id}`,
      iouTemplate
    ) as Observable<IouTemplate>;
  }
}
