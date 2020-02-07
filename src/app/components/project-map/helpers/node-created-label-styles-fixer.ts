import { Injectable } from '@angular/core';
import { FontBBoxCalculator } from '../../../cartography/helpers/font-bbox-calculator';
import { Node } from '../../../cartography/models/node';

@Injectable()
export class NodeCreatedLabelStylesFixer {
  MARGIN_BETWEEN_NODE_AND_LABEL = 8;

  constructor(
    private fontBBCalculator: FontBBoxCalculator
  ) {}

  fix(node: Node): Node {
    node.label.style = 'font-family: TypeWriter;font-size: 10.0;font-weight: bold;fill: #000000;fill-opacity: 1.0;';
    const bb = this.fontBBCalculator.calculate(node.label.text, node.label.style);

    // center label
    node.label.x = node.width / 2 - bb.width / 2;

    // move above the node
    node.label.y = -bb.height - this.MARGIN_BETWEEN_NODE_AND_LABEL;
    return node;
  }
}
