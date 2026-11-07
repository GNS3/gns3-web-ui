import { Injectable } from '@angular/core';
import { HttpEvent } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { DockerImage } from '@models/docker/docker-image';
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';
import { HttpController } from './http-controller.service';

@Injectable()
export class DockerService {
  constructor(private httpController: HttpController) {}

  getTemplates(controller: Controller): Observable<DockerTemplate[]> {
    return this.httpController.get<DockerTemplate[]>(controller, '/templates') as Observable<DockerTemplate[]>;
  }

  getTemplate(controller: Controller, template_id: string): Observable<any> {
    return this.httpController.get<DockerTemplate>(
      controller,
      `/templates/${template_id}`
    ) as Observable<DockerTemplate>;
  }

  getImages(controller: Controller): Observable<DockerImage[]> {
    return this.httpController.get<DockerImage[]>(
      controller,
      `/computes/${environment.compute_id}/docker/images`
    ) as Observable<DockerImage[]>;
  }

  getImagesForCompute(controller: Controller, computeId: string): Observable<DockerImage[]> {
    return this.httpController.get<DockerImage[]>(controller, `/computes/${computeId}/docker/images`) as Observable<
      DockerImage[]
    >;
  }

  /**
   * Pull an image on a compute. Pass a `progressId` to receive
   * `docker.image.pull` events on the global notification stream for this
   * request; the request itself resolves (204) when the pull finishes, or
   * fails with 409 when the daemon reports an error.
   */
  pullImage(controller: Controller, image: string, computeId: string, progressId?: string): Observable<void> {
    const query = progressId ? `?progress_id=${encodeURIComponent(progressId)}` : '';
    return this.httpController.post<void>(controller, `/computes/${computeId}/docker/images/pull${query}`, {
      image,
    }) as Observable<void>;
  }

  /**
   * Load a Docker image onto a compute from a `docker save` archive
   * (plain tar or gzip compressed). The file is streamed as a raw request
   * body; the request completes (204) only after the compute's Docker
   * daemon has finished loading, so `UploadProgress` reaching 100% is
   * followed by a wait for the final response event.
   */
  loadImage(controller: Controller, computeId: string, file: File): Observable<HttpEvent<unknown>> {
    return this.httpController.postFile(controller, `/computes/${computeId}/docker/images/load`, file);
  }

  /**
   * Remove a Docker image from a compute's daemon. The daemon refuses with a
   * 409 when a container still uses the image unless `force` is set.
   */
  deleteImage(controller: Controller, computeId: string, image: string, force = false): Observable<void> {
    return this.httpController.delete<void>(
      controller,
      `/computes/${computeId}/docker/images/${encodeURIComponent(image)}?force=${force}`
    ) as Observable<void>;
  }

  addTemplate(controller: Controller, dockerTemplate: any): Observable<any> {
    const templateToSend = this.prepareTemplate(dockerTemplate);
    return this.httpController.post<DockerTemplate>(
      controller,
      `/templates`,
      templateToSend
    ) as Observable<DockerTemplate>;
  }

  saveTemplate(controller: Controller, dockerTemplate: any): Observable<any> {
    const templateToSend = this.prepareTemplate(dockerTemplate);
    return this.httpController.put<DockerTemplate>(
      controller,
      `/templates/${dockerTemplate.template_id}`,
      templateToSend
    ) as Observable<DockerTemplate>;
  }

  private prepareTemplate(template: DockerTemplate): DockerTemplate {
    return {
      ...template,
      custom_adapters: template.custom_adapters || []
    };
  }
}
