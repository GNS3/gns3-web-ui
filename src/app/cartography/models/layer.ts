import { MapDrawing } from './map/map-drawing';
import { MapLink } from './map/map-link';
import { MapNode } from './map/map-node';

export class Layer {
  constructor(
    public index?: number,
    public nodes: MapNode[] = [],
    public drawings: MapDrawing[] = [],
    public links: MapLink[] = []
  ) {}
}
