import { Injectable } from "@angular/core";
import { MapListener } from "./map-listener";
import { DraggableListener } from "./draggable-listener";
import { SelectionUpdateListener } from "./selection-update-listener";
import { SelectionListener } from "./selection-listener";


@Injectable()
export class MapListeners {
  private listeners: MapListener[] = [];
  constructor(
    private nodesDraggableListener: DraggableListener,
    private selectionUpdateListener: SelectionUpdateListener,
    private selectionListener: SelectionListener
  ) {
    this.listeners.push(this.nodesDraggableListener);
    this.listeners.push(this.selectionUpdateListener);
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