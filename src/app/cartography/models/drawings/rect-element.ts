import { DrawingElement } from './drawing-element';

export class RectElement implements DrawingElement {
  height: number;
  width: number;
  fill: string;
  fill_opacity: number;
  stroke: string;
  stroke_width: number;
  stroke_dasharray: string;
}
