import { DrawingElement } from "./drawings/drawing-element";

export class Drawing {
  drawing_id: string;
  project_id: string;
  rotation: number;
  svg: string;
  x: number;
  y: number;
  z: number;
  element: DrawingElement; // @todo; move to context
}
