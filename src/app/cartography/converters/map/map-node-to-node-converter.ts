import { Injectable } from '@angular/core';

import { Converter } from '../converter';
import { MapNode } from '../../models/map/map-node';
import { MapLabelToLabelConverter } from './map-label-to-label-converter';
import { MapPortToPortConverter } from './map-port-to-port-converter';
import { Node } from '../../models/node';

@Injectable()
export class MapNodeToNodeConverter implements Converter<MapNode, Node> {
  constructor(private mapLabelToLabel: MapLabelToLabelConverter, private mapPortToPort: MapPortToPortConverter) {}

  convert(mapNode: MapNode) {
    const node = new Node();
    node.node_id = mapNode.id;
    node.command_line = mapNode.commandLine;
    node.compute_id = mapNode.computeId;
    node.console = mapNode.console;
    node.console_host = mapNode.consoleHost;
    node.first_port_name = mapNode.firstPortName;
    node.height = mapNode.height;
    node.label = mapNode.label ? this.mapLabelToLabel.convert(mapNode.label) : undefined;
    node.name = mapNode.name;
    node.node_directory = mapNode.nodeDirectory;
    node.node_type = mapNode.nodeType;
    node.port_name_format = mapNode.portNameFormat;
    node.port_segment_size = mapNode.portSegmentSize;
    node.ports = mapNode.ports ? mapNode.ports.map(mapPort => this.mapPortToPort.convert(mapPort)) : [];
    node.project_id = mapNode.projectId;
    node.status = mapNode.status;
    node.symbol = mapNode.symbol;
    node.symbol_url = mapNode.symbolUrl;
    node.width = mapNode.width;
    node.x = mapNode.x;
    node.y = mapNode.y;
    node.z = mapNode.z;
    return node;
  }
}
