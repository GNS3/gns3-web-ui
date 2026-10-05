import { Injectable } from '@angular/core';
import { Controller } from '@models/controller';
import { HttpController } from './http-controller.service';
import { Observable } from 'rxjs';
import { Image, ImageSyncJob, ImageCompatibility, ImageCompatibilityCatalog } from '@models/images';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ImageManagerService {
  constructor(private httpController: HttpController) {}

  getImages(controller: Controller) {
    return this.httpController.get<Image[]>(controller, '/images') as Observable<Image[]>;
  }

  syncImages(controller: Controller, forceChecksum = false, dryRun = false): Observable<ImageSyncJob> {
    return this.httpController.post<ImageSyncJob>(controller, '/images/sync', {
      force_checksum: forceChecksum,
      dry_run: dryRun,
    });
  }

  getSyncJob(controller: Controller, jobId: string): Observable<ImageSyncJob> {
    return this.httpController.get<ImageSyncJob>(controller, `/images/sync/jobs/${encodeURIComponent(jobId)}`);
  }

  getCompatibilityCatalog(controller: Controller): Observable<ImageCompatibilityCatalog> {
    return this.httpController.get<ImageCompatibilityCatalog>(controller, '/images/compatibility/catalog');
  }

  checkCompatibility(controller: Controller, checksums: string[]): Observable<ImageCompatibility[]> {
    return this.httpController.post<ImageCompatibility[]>(controller, '/images/compatibility', { checksums });
  }

  getImagePath(controller: Controller, install_appliance: boolean, image_path: string, subdirectory = ''): string {
    const encodedPath = image_path.split('/').map(encodeURIComponent).join('/');
    const folder = subdirectory ? `&subdirectory=${encodeURIComponent(subdirectory)}` : '';
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/images/upload/${encodedPath}?install_appliances=${install_appliance}${folder}`;
  }

  uploadedImage(controller: Controller, install_appliance, image_path, file) {
    return this.httpController.post<Image[]>(
      controller,
      `/images/upload/${image_path}?install_appliances=${install_appliance}`,
      file
    ) as Observable<Image[]>;
  }

  deleteFile(controller: Controller, image_path) {
    return this.httpController.delete<Image[]>(controller, `/images/${image_path}`) as Observable<Image[]>;
  }

  pruneImages(controller: Controller) {
    return this.httpController.delete(controller, '/images/prune');
  }

  installImages(controller: Controller) {
    return this.httpController.post(controller, '/images/install', {});
  }
}
