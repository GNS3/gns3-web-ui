import { Injectable } from '@angular/core';
import {Server} from "../models/server";
import {Observable} from "rxjs/Observable";
import {HttpServer} from "./http-server.service";
import {Snapshot} from "../models/snapshot";


@Injectable()
export class SnapshotService {

  constructor(private httpServer: HttpServer) { }

  create(server: Server, project_id: string, snapshot: Snapshot): Observable<Snapshot> {
    return this.httpServer
                .post(server, `/projects/${project_id}/snapshots`, snapshot)
                .map(response => response.json() as Snapshot);
  }

  list(server: Server, project_id: string): Observable<Snapshot[]> {
    return this.httpServer
                .get(server, `/projects/${project_id}/snapshots`)
                .map(response => response.json() as Snapshot[]);
  }

}
