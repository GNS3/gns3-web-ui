import { Injectable } from '@angular/core';
import { LinkNode } from '../../../models/link-node';
import { MapLinkNode } from '../../models/map/map-link-node';
import { Converter } from '../converter';
import { MapLabelToLabelConverter } from './map-label-to-label-converter';

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
