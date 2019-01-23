import { Injectable } from '@angular/core';
import { Server } from '../models/server';
import { Observable } from 'rxjs';
import { HttpServer } from './http-server.service';
import { Snapshot } from '../models/snapshot';

@Injectable()
export class SnapshotService {
  constructor(private httpServer: HttpServer) {}

  create(server: Server, project_id: string, snapshot: Snapshot) {
    return this.httpServer.post<Snapshot>(server, `/projects/${project_id}/snapshots`, snapshot);
  }

  list(server: Server, project_id: string) {
    return this.httpServer.get<Snapshot[]>(server, `/projects/${project_id}/snapshots`);
  }
}
