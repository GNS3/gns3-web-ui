import { Injectable } from '@angular/core';

import { Node } from '../models/node';
import { DataSource } from './datasource';

@Injectable()
export class NodesDataSource extends DataSource<Node> {
  protected getItemKey(node: Node) {
    return node.node_id;
  }
}
