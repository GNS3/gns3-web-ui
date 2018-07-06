import { Injectable } from '@angular/core';
import { Project } from '../models/project';
import { Node } from '../cartography/models/node';
import { Observable } from 'rxjs';

import 'rxjs/add/operator/map';
import { Server } from "../models/server";
import { HttpServer } from "./http-server.service";
import {Appliance} from "../models/appliance";


@Injectable()
export class NodeService {

  constructor(private httpServer: HttpServer) { }

  start(server: Server, node: Node) {
    return this.httpServer
                .post<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}/start`, {});
  }

  stop(server: Server, node: Node) {
    return this.httpServer
                .post<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}/stop`, {});
  }

  createFromAppliance(
    server: Server, project: Project, appliance: Appliance,
    x: number, y: number, compute_id: string) {
    return this.httpServer
                .post(
                  server,
                  `/projects/${project.project_id}/appliances/${appliance.appliance_id}`,
                  {'x': x, 'y': y, 'compute_id': compute_id});
  }

  updatePosition(server: Server, node: Node, x: number, y: number): Observable<Node> {
    return this.httpServer
                .put<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}`, {
                  'x': x,
                  'y': y
                });
  }

  update(server: Server, node: Node): Observable<Node> {
    return this.httpServer
                .put<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}`, {
                  'x': node.x,
                  'y': node.y,
                  'z': node.z
                });
  }

  delete(server: Server, node: Node) {
    return this.httpServer.delete<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}`);
  }

}
