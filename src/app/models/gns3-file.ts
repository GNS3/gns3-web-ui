import { Filter } from './filter';
import { LinkStyle } from './link-style';
import { Properties } from '../cartography/models/node';

/**
 * Shape of the raw `.gns3` topology file served by
 * `GET /projects/{project_id}/gns3file`.
 *
 * The file mirrors the server API schema but omits runtime-only fields
 * (status, ports, width/height, symbol_url, project_id) — those are filled
 * in by `mapGns3FileTopology` (services/gns3-file.mapper.ts). Old file
 * revisions may miss further fields, so everything except identifiers is
 * optional.
 */

export interface Gns3FileLabel {
  rotation?: number;
  style?: string;
  text?: string;
  // null means "auto-position" — the map converters center these labels.
  x?: number | null;
  y?: number | null;
}

export interface Gns3FileNode {
  node_id: string;
  name?: string;
  node_type?: string;
  compute_id?: string;
  x?: number;
  y?: number;
  z?: number;
  locked?: boolean;
  label?: Gns3FileLabel;
  symbol?: string;
  template_id?: string;
  // Normally absent from the file (server-computed); tolerated if present.
  width?: number;
  height?: number;
  console_auto_start?: boolean;
  custom_adapters?: any[];
  first_port_name?: string | null;
  port_name_format?: string;
  port_segment_size?: number;
  properties?: Properties;
}

export interface Gns3FileLinkNode {
  node_id: string;
  adapter_number?: number;
  port_number?: number;
  label?: Gns3FileLabel;
}

export interface Gns3FileLink {
  link_id: string;
  link_type?: string;
  nodes?: Gns3FileLinkNode[];
  suspend?: boolean;
  filters?: Filter;
  link_style?: LinkStyle;
}

export interface Gns3FileDrawing {
  drawing_id: string;
  rotation?: number;
  svg?: string;
  locked?: boolean;
  x?: number;
  y?: number;
  z?: number;
}

export interface Gns3FileTopology {
  nodes?: Gns3FileNode[];
  links?: Gns3FileLink[];
  drawings?: Gns3FileDrawing[];
  computes?: any[];
}

export interface Gns3ProjectFile {
  project_id?: string;
  name?: string;
  revision?: number;
  zoom?: number;
  scene_width?: number;
  scene_height?: number;
  grid_size?: number;
  show_grid?: boolean;
  snap_to_grid?: boolean;
  topology?: Gns3FileTopology;
}
