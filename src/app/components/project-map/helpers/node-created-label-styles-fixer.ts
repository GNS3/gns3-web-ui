import { Injectable } from '@angular/core';
import { Node } from '../../../cartography/models/node';
import { NodeToMapNodeConverter } from '../../../cartography/converters/map/node-to-map-node-converter';

@Injectable()
export class NodeCreatedLabelStylesFixer {
  constructor(
    private nodeToMapNodeConverter: NodeToMapNodeConverter
  ) {}

  fix(node: Node): Node {
    const mapNode = this.nodeToMapNodeConverter.convert(node);

    return node;
  }
}
