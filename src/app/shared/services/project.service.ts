import { Injectable } from '@angular/core';
import { Project } from '../models/project';
import { Node } from '../../cartography/shared/models/node';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';
import { Link } from "../../cartography/shared/models/link";
import { Server } from "../models/server";
import { HttpServer } from "./http-server.service";
import {Drawing} from "../../cartography/shared/models/drawing";

@Injectable()
export class ProjectService {

  constructor(private httpServer: HttpServer) { }

  get(server: Server, project_id: string): Observable<Project> {
    return this.httpServer
                .get(server, `/projects/${project_id}`)
                .map(response => response.json() as Project);
  }

  open(server: Server, project_id: string): Observable<Project> {
    return this.httpServer
                .post(server, `/projects/${project_id}/open`, {})
                .map(response => response.json() as Project);
  }

  list(server: Server): Observable<Project[]> {
    return this.httpServer
                .get(server, '/projects')
                .map(response => response.json() as Project[]);
  }

  nodes(server: Server, project_id: string): Observable<Node[]> {
    return this.httpServer
                .get(server, `/projects/${project_id}/nodes`)
                .map(response => response.json() as Node[]);
  }

  links(server: Server, project_id: string): Observable<Link[]> {
    return this.httpServer
                .get(server, `/projects/${project_id}/links`)
                .map(response => response.json() as Link[]);
  }

  drawings(server: Server, project_id: string): Observable<Drawing[]> {
    return this.httpServer
                .get(server, `/projects/${project_id}/drawings`)
                .map(response => response.json() as Drawing[]);
  }

  delete(server: Server, project_id: string): Observable<any> {
    return this.httpServer
                .delete(server, `/projects/${project_id}`);
  }

  notificationsPath(server: Server, project_id: string): string {
    return `ws://${server.ip}:${server.port}/v2/projects/${project_id}/notifications/ws`;
  }
}
