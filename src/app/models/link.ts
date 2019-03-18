import { Node } from '../cartography/models/node';
import { LinkNode } from './link-node';
import { Filter } from './filter';

export class Link {
  capture_file_name: string;
  capture_file_path: string;
  capturing: boolean;
  filters?: Filter;
  link_id: string;
  link_type: string;
  nodes: LinkNode[];
  project_id: string;
  suspend: boolean;

  distance: number; // this is not from server
  length: number; // this is not from server
  source: Node; // this is not from server
  target: Node; // this is not from server

  x: number; // this is not from server
  y: number; // this is not from server
}
