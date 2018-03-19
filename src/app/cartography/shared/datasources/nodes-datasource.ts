import {Node} from "../models/node.model";
import {DataSource} from "./datasource";


export class NodesDataSource extends DataSource<Node> {
  protected findIndex(node: Node) {
    return this.data.findIndex((n: Node) => n.node_id === node.node_id);
  }
}
