import { MapLinkNode } from './map-link-node';
import { MapNode } from './map-node';
import { Indexed } from '../../datasources/map-datasource';

export class MapLink implements Indexed {
  id: string;
  captureFileName: string;
  captureFilePath: string;
  capturing: boolean;
  linkType: string;
  nodes: MapLinkNode[];
  projectId: string;

  distance: number; // this is not from server
  length: number; // this is not from server
  source: MapNode; // this is not from server
  target: MapNode; // this is not from server

  isSelected = false; // this is not from server
  x: number; // this is not from server
  y: number; // this is not from server
}
