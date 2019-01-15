import { Injectable } from '@angular/core';

import { Converter } from '../converter';
import { LabelToMapLabelConverter } from './label-to-map-label-converter';
import { LinkNode } from '../../../models/link-node';
import { MapLinkNode } from '../../models/map/map-link-node';

@Injectable()
export class LinkNodeToMapLinkNodeConverter implements Converter<LinkNode, MapLinkNode> {
  constructor(private labelToMapLabel: LabelToMapLabelConverter) {}

  convert(linkNode: LinkNode, paramaters?: { [link_id: string]: string }) {
    const mapLinkNode = new MapLinkNode();
    mapLinkNode.nodeId = linkNode.node_id;
    mapLinkNode.adapterNumber = linkNode.adapter_number;
    mapLinkNode.portNumber = linkNode.port_number;
    mapLinkNode.label = this.labelToMapLabel.convert(linkNode.label);

    if (paramaters !== undefined) {
      mapLinkNode.linkId = paramaters.link_id;
      mapLinkNode.id = `${mapLinkNode.nodeId}-${mapLinkNode.linkId}`;
    }

    return mapLinkNode;
  }
}
