import { Injectable } from "@angular/core";

import { Converter } from "../converter";
import { MapNode } from "../../models/map/map-node";
import { Node } from "../../models/node";
import { LabelToMapLabelConverter } from "./label-to-map-label-converter";
import { PortToMapPortConverter } from "./port-to-map-port-converter";


@Injectable()
export class NodeToMapNodeConverter implements Converter<Node, MapNode> {
    constructor(
        private labelToMapLabel: LabelToMapLabelConverter,
        private portToMapPort: PortToMapPortConverter
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
        mapNode.label = this.labelToMapLabel.convert(node.label);
        mapNode.name = node.name;
        mapNode.nodeDirectory = node.node_directory;
        mapNode.nodeType = node.node_type;
        mapNode.portNameFormat = node.port_name_format;
        mapNode.portSegmentSize = node.port_segment_size;
        mapNode.ports = node.ports.map((port) => this.portToMapPort.convert(port));
        mapNode.projectId = node.project_id;
        mapNode.status = node.status;
        mapNode.symbol = node.symbol;
        mapNode.width = node.width;
        mapNode.x = node.x;
        mapNode.y = node.y;
        mapNode.z = node.z;
        return mapNode;        
    }
}
