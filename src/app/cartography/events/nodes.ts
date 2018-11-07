import { Node } from "../models/node";

class NodeEvent {
    constructor(
        public event: any,
        public node: Node
    ) {}
}

export class NodeDragging extends NodeEvent {}
export class NodeDragged extends NodeEvent {}

export class NodeClicked extends NodeEvent {}
export class NodeContextMenu extends NodeEvent {}