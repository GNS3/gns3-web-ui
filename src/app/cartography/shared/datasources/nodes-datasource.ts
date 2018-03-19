import {Node} from "../models/node.model";
import {DataSource} from "./datasource";
import {Injectable} from "@angular/core";


@Injectable()
export class NodesDataSource extends DataSource<Node> {
  protected findIndex(node: Node) {
    return this.data.findIndex((n: Node) => n.node_id === node.node_id);
  }
}
