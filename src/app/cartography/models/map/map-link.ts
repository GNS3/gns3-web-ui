import { Filter } from '@models/filter';
import { Indexed } from '../../datasources/map-datasource';
import { MapLinkNode } from './map-link-node';
import { MapNode } from './map-node';
import { LinkStyle } from '@models/link-style';

export class MapLink implements Indexed {
  id: string;
  captureFileName: string;
  captureFilePath: string;
  capturing: boolean;
  filters?: Filter;
  linkType: string;
  nodes: MapLinkNode[];
  projectId: string;
  suspend: boolean;
  link_style?: LinkStyle;
  wireshark: boolean; // true for Web Wireshark, false for traditional Wireshark

  distance: number; // this is not from controller
  length: number; // this is not from controller
  source: MapNode; // this is not from controller
  target: MapNode; // this is not from controller

  isSelected = false; // this is not from controller
  isMultiplied = false; // this is not from controller
  parallelLinksCount = 1; // this is not from controller
  x: number; // this is not from controller
  y: number; // this is not from controller
}
