import { Injectable } from '@angular/core';
import { Controller } from '@models/controller';
import { Snapshot } from '@models/snapshot';
import { HttpController } from './http-controller.service';

@Injectable()
export class SnapshotService {
  constructor(private httpController: HttpController) {}

  create(controller: Controller, project_id: string, snapshot: Snapshot) {
    return this.httpController.post<Snapshot>(controller, `/projects/${project_id}/snapshots`, snapshot);
  }

  delete(controller: Controller, project_id: string, snapshot_id: string) {
    return this.httpController.delete(controller, `/projects/${project_id}/snapshots/${snapshot_id}`);
  }

  list(controller: Controller, project_id: string) {
    return this.httpController.get<Snapshot[]>(controller, `/projects/${project_id}/snapshots`);
  }

  restore(controller: Controller, project_id: string, snapshot_id: string) {
    return this.httpController.post(controller, `/projects/${project_id}/snapshots/${snapshot_id}/restore`, {});
  }
}
