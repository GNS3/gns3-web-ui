import { Injectable } from "@angular/core";
import { MapListener } from "./map-listener";
import { NodesDraggableListener } from "./nodes-draggable-listener";
import { SelectionListener } from "./selection-listener";


@Injectable()
export class MapListeners {
  private listeners: MapListener[] = [];
  constructor(
    private nodesDraggableListener: NodesDraggableListener,
    private selectionListener: SelectionListener
  ) {
    this.listeners.push(this.nodesDraggableListener);
    this.listeners.push(this.selectionListener);
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