import { Injectable } from '@angular/core';
import { Project } from '../models/project';
import { Node } from '../../cartography/shared/models/node.model';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';
import { Server } from "../models/server";
import { HttpServer } from "./http-server.service";


@Injectable()
export class NodeService {

  constructor(private httpServer: HttpServer) { }

  start(server: Server, node: Node): Observable<Node> {
    return this.httpServer
                .post(server, `/projects/${node.project_id}/nodes/${node.node_id}/start`, {})
                .map(response => response.json() as Node);
  }

  stop(server: Server, node: Node): Observable<Node> {
    return this.httpServer
                .post(server, `/projects/${node.project_id}/nodes/${node.node_id}/stop`, {})
                .map(response => response.json() as Node);
  }

}
