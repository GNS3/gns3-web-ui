import { MapNode } from "./map/map-node";
import { MapDrawing } from "./map/map-drawing";
import { MapLink } from "./map/map-link";

export class Layer {
  constructor(
    public index?: number,
    public nodes: MapNode[] = [],
    public drawings: MapDrawing[] = [],
    public links: MapLink[] = []
  ) {
  }
}
