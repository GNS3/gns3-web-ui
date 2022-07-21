import { Injectable } from '@angular/core';
import{ Controller } from '../models/controller';
import { Snapshot } from '../models/snapshot';
import { HttpController } from './http-controller.service';

@Injectable()
export class SnapshotService {
  constructor(private httpServer: HttpController) {}

  create(controller:Controller , project_id: string, snapshot: Snapshot) {
    return this.httpServer.post<Snapshot>(controller, `/projects/${project_id}/snapshots`, snapshot);
  }

  delete(controller:Controller , project_id: string, snapshot_id: string) {
    return this.httpServer.delete(controller, `/projects/${project_id}/snapshots/${snapshot_id}`);
  }

  list(controller:Controller , project_id: string) {
    return this.httpServer.get<Snapshot[]>(controller, `/projects/${project_id}/snapshots`);
  }

  restore(controller:Controller , project_id: string, snapshot_id: string) {
    return this.httpServer.post(controller, `/projects/${project_id}/snapshots/${snapshot_id}/restore`, {});
  }
}
