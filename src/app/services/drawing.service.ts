import { Injectable } from '@angular/core';
import { Drawing } from '../cartography/models/drawing';
import { Observable } from 'rxjs';

import 'rxjs/add/operator/map';
import { Server } from "../models/server";
import { HttpServer } from "./http-server.service";


@Injectable()
export class DrawingService {

  constructor(private httpServer: HttpServer) { }

  updatePosition(server: Server, drawing: Drawing, x: number, y: number): Observable<Drawing> {
    return this.httpServer
      .put<Drawing>(server, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`, {
        'x': x,
        'y': y
      });
  }

  update(server: Server, drawing: Drawing): Observable<Drawing> {
    return this.httpServer
      .put<Drawing>(server, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`, {
        'x': drawing.x,
        'y': drawing.y,
        'z': drawing.z
      });
  }

  delete(server: Server, drawing: Drawing) {
    return this.httpServer.delete<Drawing>(server, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`);
  }

}
