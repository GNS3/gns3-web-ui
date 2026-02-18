import { DrawingElement } from './drawing-element';

export class EllipseElement implements DrawingElement {
  height: number;
  width: number;
  cx: number;
  cy: number;
  fill: string;
  fill_opacity: number;
  rx: number;
  ry: number;
  stroke: string;
  stroke_width: number;
  stroke_dasharray: string;
}
