import { MapNode } from "../models/map/map-node";
import { MapPort } from "../models/map/map-port";


// export class LinkCreated {
//   constructor(
//       public sourceNode: Node,
//       public sourcePort: Port,
//       public targetNode: Node,
//       public targetPort: Port
//   ) {}
// }

export class MapLinkCreated {
  constructor(
      public sourceNode: MapNode,
      public sourcePort: MapPort,
      public targetNode: MapNode,
      public targetPort: MapPort
  ) {}
}
