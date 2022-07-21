import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { QemuBinary } from '../models/qemu/qemu-binary';
import { QemuImage } from '../models/qemu/qemu-image';
import { QemuImg } from '../models/qemu/qemu-img';
import{ Controller } from '../models/controller';
import { QemuTemplate } from '../models/templates/qemu-template';
import { HttpServer } from './http-server.service';

@Injectable()
export class QemuService {
  constructor(private httpServer: HttpServer) {}

  getTemplates(controller:Controller ): Observable<QemuTemplate[]> {
    return this.httpServer.get<QemuTemplate[]>(controller, '/templates') as Observable<QemuTemplate[]>;
  }

  getTemplate(controller:Controller , template_id: string): Observable<QemuTemplate> {
    return this.httpServer.get<QemuTemplate>(controller, `/templates/${template_id}`) as Observable<QemuTemplate>;
  }

  getImagePath(controller:Controller , filename: string): string {
    return `${controller.protocol}//${controller.host}:${controller.port}/images/upload/${filename}`;
  }

  getBinaries(controller:Controller ): Observable<QemuBinary[]> {
    return this.httpServer.get<QemuBinary[]>(controller, '/computes/local/qemu/binaries') as Observable<QemuBinary[]>;
  }

  getImages(controller:Controller ): Observable<any> {
    return this.httpServer.get<QemuImage[]>(controller, '/images?image_type=qemu') as Observable<QemuImage[]>;
  }

  addImage(controller:Controller , qemuImg: QemuImg): Observable<QemuImg> {
    return this.httpServer.post<QemuImg>(controller, '/images/upload', qemuImg) as Observable<QemuImg>;
  }

  addTemplate(controller:Controller , qemuTemplate: QemuTemplate): Observable<QemuTemplate> {
    return this.httpServer.post<QemuTemplate>(controller, `/templates`, qemuTemplate) as Observable<QemuTemplate>;
  }

  saveTemplate(controller:Controller , qemuTemplate: QemuTemplate): Observable<QemuTemplate> {
    return this.httpServer.put<QemuTemplate>(
      controller,
      `/templates/${qemuTemplate.template_id}`,
      qemuTemplate
    ) as Observable<QemuTemplate>;
  }
}
