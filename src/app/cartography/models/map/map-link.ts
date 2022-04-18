import { Filter } from '../../../models/filter';
import { Indexed } from '../../datasources/map-datasource';
import { MapLinkNode } from './map-link-node';
import { MapNode } from './map-node';
import { LinkStyle } from '../../../models/link-style';

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

  distance: number; // this is not from server
  length: number; // this is not from server
  source: MapNode; // this is not from server
  target: MapNode; // this is not from server

  isSelected = false; // this is not from server
  isMultiplied = false; // this is not from server
  x: number; // this is not from server
  y: number; // this is not from server
}
