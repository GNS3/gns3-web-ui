import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import { SvgToDrawingConverter } from '../cartography/helpers/svg-to-drawing-converter';
import { Drawing } from '../cartography/models/drawing';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { HttpController } from './http-controller.service';

@Injectable()
export class DrawingService {
  constructor(private httpController: HttpController, private svgToDrawingConverter: SvgToDrawingConverter) {}

  add(controller: Controller, project_id: string, x: number, y: number, svg: string) {
    return this.httpController.post<Drawing>(controller, `/projects/${project_id}/drawings`, {
      svg: svg,
      x: Math.round(x),
      y: Math.round(y),
      z: 1,
    });
  }

  duplicate(controller: Controller, project_id: string, drawing: Drawing) {
    return this.httpController.post<Drawing>(controller, `/projects/${project_id}/drawings`, {
      svg: drawing.svg,
      rotation: drawing.rotation,
      x: drawing.x + 10,
      y: drawing.y + 10,
      z: drawing.z,
    });
  }

  updatePosition(controller: Controller, project: Project, drawing: Drawing, x: number, y: number): Observable<Drawing> {
    let xPosition: number = Math.round(x);
    let yPosition: number = Math.round(y);

    if (project.snap_to_grid) {
      drawing.element = this.svgToDrawingConverter.convert(drawing.svg);

      xPosition =
        Math.round((xPosition + drawing.element.width / 2) / project.drawing_grid_size) * project.drawing_grid_size;
      yPosition =
        Math.round((yPosition + drawing.element.width / 2) / project.drawing_grid_size) * project.drawing_grid_size;

      xPosition = Math.round(xPosition - drawing.element.width / 2);
      yPosition = Math.round(yPosition - drawing.element.height / 2);
    }

    return this.httpController.put<Drawing>(controller, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`, {
      x: xPosition,
      y: yPosition,
    });
  }

  updateSizeAndPosition(controller: Controller, drawing: Drawing, x: number, y: number, svg: string): Observable<Drawing> {
    return this.httpController.put<Drawing>(controller, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`, {
      svg: svg,
      x: Math.round(x),
      y: Math.round(y),
    });
  }

  updateText(controller: Controller, drawing: Drawing, svg: string): Observable<Drawing> {
    return this.httpController.put<Drawing>(controller, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`, {
      svg: svg,
      x: Math.round(drawing.x),
      y: Math.round(drawing.y),
      z: drawing.z,
    });
  }

  update(controller: Controller, drawing: Drawing): Observable<Drawing> {
    return this.httpController.put<Drawing>(controller, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`, {
      locked: drawing.locked,
      svg: drawing.svg,
      rotation: drawing.rotation,
      x: Math.round(drawing.x),
      y: Math.round(drawing.y),
      z: drawing.z,
    });
  }

  delete(controller: Controller, drawing: Drawing) {
    return this.httpController.delete<Drawing>(controller, `/projects/${drawing.project_id}/drawings/${drawing.drawing_id}`);
  }

  lockAllNodes(controller: Controller,project:Project){
    return this.httpController.post(controller, `/projects/${project.project_id}/lock`,{});

  }
  unLockAllNodes(controller: Controller,project:Project){
    return this.httpController.post(controller, `/projects/${project.project_id}/unlock`,{});

  }
}
