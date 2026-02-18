import { MapNode } from '../models/map/map-node';

class NodeEvent {
  constructor(public event: any, public node: MapNode) {}
}

export class NodeClicked extends NodeEvent {}
export class NodeContextMenu extends NodeEvent {}
