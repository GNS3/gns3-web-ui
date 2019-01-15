import { Injectable } from '@angular/core';

import { Converter } from '../converter';
import { MapNode } from '../../models/map/map-node';
import { Node } from '../../models/node';
import { LabelToMapLabelConverter } from './label-to-map-label-converter';
import { PortToMapPortConverter } from './port-to-map-port-converter';
import { FontBBoxCalculator } from '../../helpers/font-bbox-calculator';
import { CssFixer } from '../../helpers/css-fixer';
import { FontFixer } from '../../helpers/font-fixer';

@Injectable()
export class NodeToMapNodeConverter implements Converter<Node, MapNode> {
  constructor(
    private labelToMapLabel: LabelToMapLabelConverter,
    private portToMapPort: PortToMapPortConverter,
    private fontBBoxCalculator: FontBBoxCalculator,
    private cssFixer: CssFixer,
    private fontFixer: FontFixer
  ) {}

  convert(node: Node) {
    const mapNode = new MapNode();
    mapNode.id = node.node_id;
    mapNode.commandLine = node.command_line;
    mapNode.computeId = node.compute_id;
    mapNode.console = node.console;
    mapNode.consoleHost = node.console_host;
    mapNode.firstPortName = node.first_port_name;
    mapNode.height = node.height;
    mapNode.label = this.labelToMapLabel.convert(node.label, { node_id: node.node_id });
    mapNode.name = node.name;
    mapNode.nodeDirectory = node.node_directory;
    mapNode.nodeType = node.node_type;
    mapNode.portNameFormat = node.port_name_format;
    mapNode.portSegmentSize = node.port_segment_size;
    mapNode.ports = node.ports.map(port => this.portToMapPort.convert(port));
    mapNode.projectId = node.project_id;
    mapNode.status = node.status;
    mapNode.symbol = node.symbol;
    mapNode.symbolUrl = node.symbol_url;
    mapNode.width = node.width;
    mapNode.x = node.x;
    mapNode.y = node.y;
    mapNode.z = node.z;

    if (mapNode.label !== undefined) {
      const fixedCss = this.cssFixer.fix(mapNode.label.style);
      const fixedFont = this.fontFixer.fixStyles(fixedCss);
      const box = this.fontBBoxCalculator.calculate(mapNode.label.text, fixedFont);

      if (node.label.x === null || node.label.y === null) {
        mapNode.label.x = node.width / 2 - box.width / 2 + 3;
        mapNode.label.y = -8;
      }
    }
    return mapNode;
  }
}
