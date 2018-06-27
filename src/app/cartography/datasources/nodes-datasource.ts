import { Injectable } from "@angular/core";

import { Node } from "../models/node";
import { DataSource } from "./datasource";


@Injectable()
export class NodesDataSource extends DataSource<Node> {
  protected findIndex(node: Node) {
    return this.data.findIndex((n: Node) => n.node_id === node.node_id);
  }
}
