import { MapNode } from "../models/map/map-node";
import { MapPort } from "../models/map/map-port";


export class LinkCreated {
    constructor(
        public sourceNode: MapNode,
        public sourcePort: MapPort,
        public targetNode: MapNode,
        public targetPort: MapPort
    ) {}
}
