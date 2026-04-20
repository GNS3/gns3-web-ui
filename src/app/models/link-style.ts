export class LinkStyle {
  color?: string;
  width?: number;
  type?: number;
  link_type?: string;
  bezier_curviness?: number;
  flowchart_roundness?: number;
  control_offset?: [number, number]; // For freeform link type: [x, y] offset from midpoint
}
