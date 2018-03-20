import {Node} from "../models/node";

export class SelectionManager {
  private selectedNodes: Node[] = [];

  constructor() {}

  public setSelectedNodes(nodes: Node[]) {
    this.selectedNodes = nodes;
  }


}
