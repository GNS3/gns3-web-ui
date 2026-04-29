import { DrawingElement } from './drawing-element';

export type LineDrawingType = 'straight' | 'freeform';

export class LineElement implements DrawingElement {
  height: number;
  width: number;
  stroke: string;
  stroke_width: number;
  stroke_dasharray: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  arrow_start: boolean;
  arrow_end: boolean;
  drawing_type: LineDrawingType;
  control_offset: [number, number]; // For freeform mode: [x, y] offset from midpoint
}
