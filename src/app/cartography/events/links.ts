import { Node } from "../models/node";
import { Port } from "../../models/port";


export class LinkCreated {
    constructor(
        public sourceNode: Node,
        public sourcePort: Port,
        public targetNode: Node,
        public targetPort: Port
    ){}
}
