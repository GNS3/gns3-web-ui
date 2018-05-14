import { DrawingElement } from "./drawing-element";


export class TextElement implements DrawingElement {
  height: number;
  width: number;
  fill: string;
  fill_opacity: string;
  font_family: string;
  font_size: string;
  font_weight: number;
}
