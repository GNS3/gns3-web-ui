import { Node } from '../cartography/models/node';
import { Filter } from './filter';
import { LinkNode } from './link-node';
import { LinkStyle } from './link-style';
import { MarkerMap } from './marker';

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
  link_style?: LinkStyle;
  kernel_datapath?: boolean; // Link wired on the kernel datapath (veth bridge) — extended impairment filters; undefined on old servers
  show_filters_icon: boolean; // Control visibility of filter icons on the link (from server)
  wireshark: boolean; // true for Web Wireshark, false for traditional Wireshark
  markers?: MarkerMap; // Traffic-insight markers (non-empty ⇒ show the markers icon)
  interface_statuses?: Array<'started' | 'stopped' | undefined>; // runtime only; excluded from update payloads

  distance: number; // this is not from controller
  length: number; // this is not from controller
  source: Node; // this is not from controller
  target: Node; // this is not from controller

  x: number; // this is not from controller
  y: number; // this is not from controller
}
