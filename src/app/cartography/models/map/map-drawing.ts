import { DrawingElement } from '../drawings/drawing-element';
import { Indexed } from '../../datasources/map-datasource';

export class MapDrawing implements Indexed {
  id: string;
  projectId: string;
  rotation: number;
  svg: string;
  x: number;
  y: number;
  z: number;
  element: DrawingElement; // @todo; apply converters
}
