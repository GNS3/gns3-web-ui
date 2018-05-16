import { DrawingElement } from "./drawing-element";


export class TextElement implements DrawingElement {
  height: number;
  width: number;
  text: string;
  fill: string;
  fill_opacity: number;
  font_family: string;
  font_size: number;
  font_weight: string;
}
