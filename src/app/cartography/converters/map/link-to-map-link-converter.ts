import { Injectable } from '@angular/core';
import { Link } from '@models/link';
import { MapLink } from '../../models/map/map-link';
import { Converter } from '../converter';
import { LinkNodeToMapLinkNodeConverter } from './link-node-to-map-link-node-converter';

@Injectable()
export class LinkToMapLinkConverter implements Converter<Link, MapLink> {
  constructor(private linkNodeToMapLinkNode: LinkNodeToMapLinkNodeConverter) {}

  convert(link: Link) {
    const mapLink = new MapLink();
    mapLink.id = link.link_id;
    mapLink.captureFileName = link.capture_file_name;
    mapLink.captureFilePath = link.capture_file_path;
    mapLink.capturing = link.capturing;
    mapLink.filters = link.filters;
    mapLink.link_style = link.link_style;
    mapLink.linkType = link.link_type;
    mapLink.nodes = link.nodes.map((linkNode) =>
      this.linkNodeToMapLinkNode.convert(linkNode, { link_id: link.link_id })
    );
    mapLink.projectId = link.project_id;
    mapLink.suspend = link.suspend;
    return mapLink;
  }
}
