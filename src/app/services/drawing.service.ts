import { Injectable } from '@angular/core';
import { Drawing } from '../cartography/models/drawing';
import { Observable } from 'rxjs';

import 'rxjs/add/operator/map';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';

@Injectable()
export class DrawingService {
  constructor(private httpServer: HttpServer) {}

  add(server: Server, project_id: string, x: number, y: number, svg: string) {
    return this.httpServer.post<Drawing>(server, `/projects/${project_id}/drawings`, {
      svg: svg,
      x: Math.round(x),
      y: Math.round(y),
      z: 1
    });
  }

  duplicate(server: Server, project_id: string, drawing: Drawing) {
    return this.httpServer.post<Drawing>(server, `/projects/${project_id}/drawings`, {
      svg: drawing.svg,
      rotation: drawing.rotation,
      x: drawing.x + 10,
      y: drawing.y + 10,
      z: drawing.z
    });
  }

  updatePosition(server: Server, drawing: Drawing, x: number, y: number): Observable<Drawing> {
    return this.httpServer.put<Drawing>(server, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`, {
      x: Math.round(x),
      y: Math.round(y)
    });
  }

  updateSizeAndPosition(server: Server, drawing: Drawing, x: number, y: number, svg: string): Observable<Drawing> {
    return this.httpServer.put<Drawing>(server, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`, {
      svg: svg,
      x: Math.round(x),
      y: Math.round(y)
    });
  }

  updateText(server: Server, drawing: Drawing, svg: string): Observable<Drawing> {
    return this.httpServer.put<Drawing>(server, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`, {
      svg: svg,
      x: Math.round(drawing.x),
      y: Math.round(drawing.y),
      z: drawing.z
    });
  }

  update(server: Server, drawing: Drawing): Observable<Drawing> {
    return this.httpServer.put<Drawing>(server, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`, {
      locked: drawing.locked,
      svg: drawing.svg,
      rotation: drawing.rotation,
      x: Math.round(drawing.x),
      y: Math.round(drawing.y),
      z: drawing.z
    });
  }

  delete(server: Server, drawing: Drawing) {
    return this.httpServer.delete<Drawing>(server, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`);
  }
}
