import { MapLinkNode } from "./map-link-node";

export class MapLink {
    id: string;
    captureFileName: string;
    captureFilePath: string;
    capturing: boolean;
    linkType: string;
    nodes: MapLinkNode[];
    projectId: string;

    distance: number; // this is not from server
    length: number; // this is not from server
    source: Node; // this is not from server
    target: Node; // this is not from server

    isSelected = false; // this is not from server
    x: number; // this is not from server
    y: number; // this is not from server
}
