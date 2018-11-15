import { Injectable } from "@angular/core";

import { Converter } from "../converter";
import { LinkNodeToMapLinkNodeConverter } from "./link-node-to-map-link-node-converter";
import { Link } from "../../../models/link";
import { MapLink } from "../../models/map/map-link";


@Injectable()
export class LinkToMapLinkConverter implements Converter<Link, MapLink> {
    constructor(
        private linkNodeToMapLinkNode: LinkNodeToMapLinkNodeConverter
    ) {}
    
    convert(link: Link) {
        const mapLink = new MapLink();
        mapLink.id = link.link_id;
        mapLink.captureFileName = link.capture_file_name;
        mapLink.captureFilePath = link.capture_file_path;
        mapLink.capturing = link.capturing;
        mapLink.linkType = link.link_type;
        mapLink.nodes = link.nodes.map((linkNode) => this.linkNodeToMapLinkNode.convert(linkNode));
        mapLink.projectId = link.project_id;
        return mapLink;
    }
}
