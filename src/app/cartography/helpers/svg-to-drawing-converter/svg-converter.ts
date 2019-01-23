import { DrawingElement } from '../../models/drawings/drawing-element';

export interface SvgConverter {
  convert(element: Element): DrawingElement;
}
