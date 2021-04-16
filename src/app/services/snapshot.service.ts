import { Injectable } from '@angular/core';
import { Server } from '../models/server';
import { Snapshot } from '../models/snapshot';
import { HttpServer } from './http-server.service';

@Injectable()
export class SnapshotService {
  constructor(private httpServer: HttpServer) {}

  create(server: Server, project_id: string, snapshot: Snapshot) {
    return this.httpServer.post<Snapshot>(server, `/projects/${project_id}/snapshots`, snapshot);
  }

  delete(server: Server, project_id: string, snapshot_id: string) {
    return this.httpServer.delete(server, `/projects/${project_id}/snapshots/${snapshot_id}`);
  }

  list(server: Server, project_id: string) {
    return this.httpServer.get<Snapshot[]>(server, `/projects/${project_id}/snapshots`);
  }

  restore(server: Server, project_id: string, snapshot_id: string) {
    return this.httpServer.post(server, `/projects/${project_id}/snapshots/${snapshot_id}/restore`, {});
  }
}
