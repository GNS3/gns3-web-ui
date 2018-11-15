import { Node } from "../cartography/models/node";
import { LinkNode } from "./link-node";
import { Selectable } from "../cartography/managers/selection-manager";


export class Link implements Selectable {
  capture_file_name: string;
  capture_file_path: string;
  capturing: boolean;
  link_id: string;
  link_type: string;
  nodes: LinkNode[];
  project_id: string;


  distance: number; // this is not from server
  length: number; // this is not from server
  source: Node; // this is not from server
  target: Node; // this is not from server

  is_selected = false; // this is not from server
  x: number; // this is not from server
  y: number; // this is not from server
}
