import {Node} from "../models/node.model";

export class SelectionManager {
  private selectedNodes: Node[] = [];

  constructor() {}

  public setSelectedNodes(nodes: Node[]) {
    this.selectedNodes = nodes;
  }


}
