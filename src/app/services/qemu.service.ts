import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { QemuBinary } from '@models/qemu/qemu-binary';
import { QemuImage } from '@models/qemu/qemu-image';
import { QemuImg } from '@models/qemu/qemu-img';
import { Controller } from '@models/controller';
import { QemuTemplate } from '@models/templates/qemu-template';
import { HttpController } from './http-controller.service';
import { environment } from 'environments/environment';

@Injectable()
export class QemuService {
  constructor(private httpController: HttpController) {}

  getTemplates(controller: Controller): Observable<QemuTemplate[]> {
    return this.httpController.get<QemuTemplate[]>(controller, '/templates') as Observable<QemuTemplate[]>;
  }

  getTemplate(controller: Controller, template_id: string): Observable<QemuTemplate> {
    return this.httpController.get<QemuTemplate>(controller, `/templates/${template_id}`) as Observable<QemuTemplate>;
  }

  getImagePath(controller: Controller, filename: string): string {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/images/upload/${filename}`;
  }

  getImages(controller: Controller): Observable<any> {
    return this.httpController.get<QemuImage[]>(controller, '/images?image_type=qemu') as Observable<QemuImage[]>;
  }

  /**
   * Create a QEMU disk image for a node
   * API: POST /projects/{project_id}/nodes/{node_id}/qemu/disk_image/{disk_name}
   */
  createDiskImage(
    controller: Controller,
    projectId: string,
    nodeId: string,
    diskName: string,
    options: QemuDiskImageOptions
  ): Observable<any> {
    return this.httpController.post<any>(
      controller,
      `/projects/${projectId}/nodes/${nodeId}/qemu/disk_image/${diskName}`,
      options
    ) as Observable<any>;
  }

  addTemplate(controller: Controller, qemuTemplate: QemuTemplate): Observable<QemuTemplate> {
    const templateToSend = this.prepareTemplate(qemuTemplate);
    return this.httpController.post<QemuTemplate>(controller, `/templates`, templateToSend) as Observable<QemuTemplate>;
  }

  saveTemplate(controller: Controller, qemuTemplate: QemuTemplate): Observable<QemuTemplate> {
    const templateToSend = this.prepareTemplate(qemuTemplate);
    return this.httpController.put<QemuTemplate>(
      controller,
      `/templates/${qemuTemplate.template_id}`,
      templateToSend
    ) as Observable<QemuTemplate>;
  }

  private prepareTemplate(template: QemuTemplate): QemuTemplate {
    return {
      ...template,
      custom_adapters: template.custom_adapters || []
    };
  }
}

export interface QemuDiskImageOptions {
  format: string;
  size: number; // Size in MB
  preallocation?: string;
  cluster_size?: number;
  refcount_bits?: number;
  lazy_refcounts?: string;
  subformat?: string;
  static?: string;
  zeroed_grain?: string;
  adapter_type?: string;
}
