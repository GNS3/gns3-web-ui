import { DrawingElement } from "./drawing-element";


export class LineElement implements DrawingElement {
  height: number;
  width: number;
  stroke: string;
  stroke_width: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}
