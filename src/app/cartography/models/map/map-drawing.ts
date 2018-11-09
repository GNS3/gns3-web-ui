import { DrawingElement } from "../drawings/drawing-element";

export class MapDrawing {
    id: string;
    projectId: string;
    rotation: number;
    svg: string;
    x: number;
    y: number;
    z: number;
    element: DrawingElement; // @todo; apply converters
}
