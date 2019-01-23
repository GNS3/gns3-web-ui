import { DrawingElement } from './drawing-element';
import { Font } from '../font';

export class TextElement implements DrawingElement, Font {
  height: number;
  width: number;
  text: string;
  fill: string;
  fill_opacity: number;
  font_family: string;
  font_size: number;
  font_weight: string;
  text_decoration: string;
}
