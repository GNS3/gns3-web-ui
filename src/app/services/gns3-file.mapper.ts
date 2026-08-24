import { Drawing } from '../cartography/models/drawing';
import { Node } from '../cartography/models/node';
import { Link } from '../models/link';
import { LinkNode } from '../models/link-node';
import {
  Gns3FileLabel,
  Gns3FileLink,
  Gns3FileLinkNode,
  Gns3FileNode,
  Gns3ProjectFile,
} from '../models/gns3-file';

export interface TopologyPreviewData {
  nodes: Node[];
  links: Link[];
  drawings: Drawing[];
}

// Mirrors the style the server persists for freshly created node labels so
// synthesized labels (files missing the label field) render identically.
// Deliberately no fill: LabelWidget.applyLabelColorMode strips fill from
// non-custom labels anyway, and the font metrics are what the label bbox
// calculation actually uses.
const DEFAULT_NODE_LABEL_STYLE = 'font-family: TypeWriter;font-size: 10;font-weight: bold;';

function toLabel(label: Gns3FileLabel | undefined, fallbackText: string) {
  if (label) {
    return {
      rotation: label.rotation ?? 0,
      style: label.style ?? DEFAULT_NODE_LABEL_STYLE,
      text: label.text ?? fallbackText,
      x: label.x ?? null,
      y: label.y ?? null,
    };
  }
  // null x/y → NodeToMapNodeConverter centers the label over the node.
  return { rotation: 0, style: DEFAULT_NODE_LABEL_STYLE, text: fallbackText, x: null, y: null };
}

function toNode(fileNode: Gns3FileNode, projectId: string): Node {
  const name = fileNode.name ?? fileNode.node_id;
  return {
    ...fileNode,
    name,
    project_id: projectId,
    // The file has no runtime state — render everything as stopped.
    status: 'stopped',
    // Filled by NodeSymbolResolverService before the map mounts (a static
    // preview gets no WS-driven redraw that could fix these later).
    width: fileNode.width ?? 0,
    height: fileNode.height ?? 0,
    symbol_url: null,
    ports: [],
    label: toLabel(fileNode.label, name),
    console: null,
    console_host: null,
    console_type: null,
    command_line: null,
    node_directory: null,
    x: fileNode.x ?? 0,
    y: fileNode.y ?? 0,
    z: fileNode.z ?? 0,
    locked: fileNode.locked ?? false,
    compute_id: fileNode.compute_id ?? null,
    node_type: fileNode.node_type ?? '',
    first_port_name: fileNode.first_port_name ?? null,
    port_name_format: fileNode.port_name_format ?? '{0}',
    port_segment_size: fileNode.port_segment_size ?? 0,
    properties: fileNode.properties ?? ({} as any),
  } as Node;
}

function toLinkNode(fileLinkNode: Gns3FileLinkNode): LinkNode {
  return {
    node_id: fileLinkNode.node_id,
    adapter_number: fileLinkNode.adapter_number ?? 0,
    port_number: fileLinkNode.port_number ?? 0,
    label: toLabel(fileLinkNode.label, '') as any,
  };
}

function toLink(fileLink: Gns3FileLink, projectId: string): Link {
  return {
    ...fileLink,
    project_id: projectId,
    link_id: fileLink.link_id,
    link_type: fileLink.link_type ?? 'ethernet',
    nodes: (fileLink.nodes ?? []).map(toLinkNode),
    // capturing:false gates the filters deref in the link widget;
    // show_filters_icon must be explicitly false (the widget shows on !== false).
    capturing: false,
    show_filters_icon: false,
    wireshark: false,
    suspend: fileLink.suspend ?? false,
    filters: fileLink.filters ?? {},
    capture_file_name: null,
    capture_file_path: null,
  } as Link;
}

function toDrawing(fileDrawing: any, projectId: string): Drawing {
  return {
    ...fileDrawing,
    project_id: projectId,
    rotation: fileDrawing.rotation ?? 0,
    svg: fileDrawing.svg ?? '',
    locked: fileDrawing.locked ?? false,
    x: fileDrawing.x ?? 0,
    y: fileDrawing.y ?? 0,
    z: fileDrawing.z ?? 0,
  } as Drawing;
}

/**
 * Map a raw `.gns3` topology file onto the server-API-shaped models the map
 * renders from (`Node`/`Link`/`Drawing`). Pure — does not mutate the input.
 */
export function mapGns3FileTopology(file: Gns3ProjectFile, projectId: string): TopologyPreviewData {
  const topology = file?.topology ?? {};
  return {
    nodes: (topology.nodes ?? []).map((n) => toNode(n, projectId)),
    links: (topology.links ?? []).map((l) => toLink(l, projectId)),
    drawings: (topology.drawings ?? []).map((d) => toDrawing(d, projectId)),
  };
}
