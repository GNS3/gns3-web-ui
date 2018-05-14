import { DrawingElement } from "../../../shared/models/drawings/drawing-element";

export interface SvgConverter {
  convert(node: Node): DrawingElement;
}
