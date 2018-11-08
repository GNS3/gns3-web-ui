import { Injectable } from "@angular/core";
import { MapListener } from "./map-listener";
import { DrawingsDraggableListener } from "./drawings-draggable-listener";
import { NodesDraggableListener } from "./nodes-draggable-listener";


@Injectable()
export class MapListeners {
  private listeners: MapListener[] = [];
  constructor(
    private drawingsDraggableListener: DrawingsDraggableListener,
    private nodesDraggableListener: NodesDraggableListener
  ) {
    this.listeners.push(this.drawingsDraggableListener);
    this.listeners.push(this.nodesDraggableListener);
  }

  public onInit(svg: any) {
    this.listeners.forEach((listener) => {
      listener.onInit(svg);
    });
  }

  public onDestroy() {
    this.listeners.forEach((listener) => {
      listener.onDestroy();
    });
  }
}