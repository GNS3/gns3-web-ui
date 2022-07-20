import { Injectable } from '@angular/core';
import { Server } from '../models/server';
import { Snapshot } from '../models/snapshot';
import { HttpServer } from './http-server.service';

@Injectable()
export class SnapshotService {
  constructor(private httpServer: HttpServer) {}

  create(controller: Server, project_id: string, snapshot: Snapshot) {
    return this.httpServer.post<Snapshot>(controller, `/projects/${project_id}/snapshots`, snapshot);
  }

  delete(controller: Server, project_id: string, snapshot_id: string) {
    return this.httpServer.delete(controller, `/projects/${project_id}/snapshots/${snapshot_id}`);
  }

  list(controller: Server, project_id: string) {
    return this.httpServer.get<Snapshot[]>(controller, `/projects/${project_id}/snapshots`);
  }

  restore(controller: Server, project_id: string, snapshot_id: string) {
    return this.httpServer.post(controller, `/projects/${project_id}/snapshots/${snapshot_id}/restore`, {});
  }
}
