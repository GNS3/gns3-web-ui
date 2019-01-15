import { Injectable } from '@angular/core';

import { Converter } from '../converter';
import { MapLinkNode } from '../../models/map/map-link-node';
import { MapLabelToLabelConverter } from './map-label-to-label-converter';
import { LinkNode } from '../../../models/link-node';

@Injectable()
export class MapLinkNodeToLinkNodeConverter implements Converter<MapLinkNode, LinkNode> {
  constructor(private mapLabelToLabel: MapLabelToLabelConverter) {}

  convert(mapLinkNode: MapLinkNode) {
    const linkNode = new LinkNode();
    linkNode.node_id = mapLinkNode.nodeId;
    linkNode.adapter_number = mapLinkNode.adapterNumber;
    linkNode.port_number = mapLinkNode.portNumber;
    linkNode.label = this.mapLabelToLabel.convert(mapLinkNode.label);
    return linkNode;
  }
}
