import { DrawingElement } from '../../models/drawings/drawing-element';

export interface DrawingElementFactory {
  getDrawingElement(): DrawingElement;
}
