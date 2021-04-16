import { Injectable } from '@angular/core';
import { Link } from '../../../models/link';
import { MapLink } from '../../models/map/map-link';
import { Converter } from '../converter';
import { MapLinkNodeToLinkNodeConverter } from './map-link-node-to-link-node-converter';

@Injectable()
export class MapLinkToLinkConverter implements Converter<MapLink, Link> {
  constructor(private mapLinkNodeToMapLinkNode: MapLinkNodeToLinkNodeConverter) {}

  convert(mapLink: MapLink) {
    const link = new Link();
    link.link_id = mapLink.id;
    link.capture_file_name = mapLink.captureFileName;
    link.capture_file_path = mapLink.captureFilePath;
    link.capturing = mapLink.capturing;
    link.filters = mapLink.filters;
    link.link_type = mapLink.linkType;
    link.nodes = mapLink.nodes.map((mapLinkNode) => this.mapLinkNodeToMapLinkNode.convert(mapLinkNode));
    link.project_id = mapLink.projectId;
    link.suspend = mapLink.suspend;
    return link;
  }
}
