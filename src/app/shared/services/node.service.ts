import { Injectable } from '@angular/core';
import { Project } from '../models/project';
import { Node } from '../../cartography/shared/models/node';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';
import { Server } from "../models/server";
import { HttpServer } from "./http-server.service";
import {Appliance} from "../models/appliance";
import {Response} from "@angular/http";


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

  createFromAppliance(
    server: Server, project: Project, appliance: Appliance,
    x: number, y: number, compute_id: string): Observable<Response> {
    return this.httpServer
                .post(
                  server,
                  `/projects/${project.project_id}/appliances/${appliance.appliance_id}`,
                  {'x': x, 'y': y, 'compute_id': compute_id});
  }

  updatePosition(server: Server, node: Node, x: number, y: number): Observable<Node> {
    return this.httpServer
                .put(server, `/projects/${node.project_id}/nodes/${node.node_id}`, {
                  'x': x,
                  'y': y
                })
                .map(response => response.json() as Node);
  }
}
